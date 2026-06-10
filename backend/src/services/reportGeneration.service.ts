import { minimatch } from 'minimatch';
import { v4 as uuidv4 } from 'uuid';
import { Report } from '../models/report.model';
import { DocumentModel } from '../models/document.model';
import { ReportInstance } from '../models/reportInstance.model';
import { uploadToS3 } from '../config/aws/s3.service';
import { sendReportEventMessage } from '../config/kafka';
import { processDocument } from './documentProcessor';
import { ProcessingResult } from './documentProcessor';

const buildCsv = (rows: ProcessingResult[]): string => {
  const header = 'filename,processingResult';
  const lines = rows.map((r) => `"${r.filename.replace(/"/g, '""')}",${r.result}`);
  return [header, ...lines].join('\n');
};

export const processReport = async (reportId: string): Promise<void> => {
  const report = await Report.findById(reportId);
  if (!report) {
    console.warn(`[ReportGeneration] Report ${reportId} not found, skipping`);
    return;
  }

  console.log(`[ReportGeneration] Processing report "${report.name}" (${reportId})`);

  const allDocuments = await DocumentModel.find({}, { Filename: 1 });

  const matchedDocuments = allDocuments.filter((doc) =>
    minimatch(doc.Filename, report.filenamePattern, { nocase: true })
  );

  console.log(
    `[ReportGeneration] Matched ${matchedDocuments.length} document(s) for pattern "${report.filenamePattern}"`
  );

  const processingResults: ProcessingResult[] = [];
  for (const doc of matchedDocuments) {
    const result = await processDocument(doc.Filename);
    processingResults.push(result);
  }

  const csv = buildCsv(processingResults);
  const csvBuffer = Buffer.from(csv, 'utf-8');
  const generatedAt = new Date();
  const s3Key = `reports/${reportId}/${uuidv4()}-${generatedAt.toISOString().replace(/[:.]/g, '-')}.csv`;

  const s3Location = await uploadToS3(s3Key, csvBuffer, 'text/csv');

  const instance = await ReportInstance.create({
    reportId: report._id,
    s3Location,
    documentCount: matchedDocuments.length,
    generatedAt,
  });

  report.lastGeneratedAt = generatedAt;
  await report.save();

  await sendReportEventMessage({
    state: 'generated',
    reportId: report._id.toString(),
    reportInstanceId: instance._id.toString(),
  });

  console.log(`[ReportGeneration] Report "${report.name}" generated successfully → ${s3Location}`);
};
