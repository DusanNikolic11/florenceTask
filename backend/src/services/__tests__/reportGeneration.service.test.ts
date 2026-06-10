// ─── Module mocks must be declared before any imports ────────────────────────
jest.mock('../../models/report.model', () => ({
  Report: { findById: jest.fn() },
}));

jest.mock('../../models/document.model', () => ({
  DocumentModel: { find: jest.fn() },
}));

jest.mock('../../models/reportInstance.model', () => ({
  ReportInstance: { create: jest.fn() },
}));

jest.mock('../../config/aws/s3.service', () => ({
  uploadToS3: jest.fn(),
}));

jest.mock('../../config/kafka', () => ({
  sendReportEventMessage: jest.fn(),
}));

// processDocument lives in its own module so Jest can intercept the call
// that reportGeneration.service.ts makes through its import binding.
jest.mock('../documentProcessor', () => ({
  processDocument: jest.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────
import { processReport } from '../reportGeneration.service';
import { Report } from '../../models/report.model';
import { DocumentModel } from '../../models/document.model';
import { ReportInstance } from '../../models/reportInstance.model';
import { uploadToS3 } from '../../config/aws/s3.service';
import { sendReportEventMessage } from '../../config/kafka';
import { processDocument } from '../documentProcessor';

// ─── Test data ────────────────────────────────────────────────────────────────

const REPORT_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const INSTANCE_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const S3_URL = 's3://test-bucket/reports/aaaaaaaaaaaaaaaaaaaaaaaa/output.csv';

/** 5 documents whose filename contains "06" — will match *06*.pdf */
const matchingDocuments = [
  { Filename: '2022_06.pdf' },
  { Filename: '2023_06.pdf' },
  { Filename: '2024_06.pdf' },
  { Filename: 'report_06_summary.pdf' },
  { Filename: 'data_06_final.pdf' },
];

/** 5 documents that do NOT contain "06" — will NOT match *06*.pdf */
const nonMatchingDocuments = [
  { Filename: '2024_07.pdf' },
  { Filename: 'annual_report.pdf' },
  { Filename: 'data_2024.pdf' },
  { Filename: 'summary_08.pdf' },
  { Filename: 'document.pdf' },
];

const allDocuments = [...matchingDocuments, ...nonMatchingDocuments]; // 10 total

// ─── Shared mock report object ────────────────────────────────────────────────
const buildMockReport = () => ({
  _id: { toString: () => REPORT_ID },
  name: 'Monthly 06 Report',
  filenamePattern: '*06*.pdf',
  lastGeneratedAt: null as Date | null,
  save: jest.fn().mockResolvedValue(undefined),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('processReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (Report.findById as jest.Mock).mockResolvedValue(buildMockReport());

    (DocumentModel.find as jest.Mock).mockResolvedValue(allDocuments);

    (processDocument as jest.Mock).mockImplementation(
      async (filename: string) => ({ filename, result: 42 })
    );

    (uploadToS3 as jest.Mock).mockResolvedValue(S3_URL);

    (ReportInstance.create as jest.Mock).mockResolvedValue({
      _id: { toString: () => INSTANCE_ID },
    });

    (sendReportEventMessage as jest.Mock).mockResolvedValue(undefined);
  });

  it('filters by pattern, processes only matching docs, uploads CSV, creates instance, and emits event', async () => {
    await processReport(REPORT_ID);

    // ── Filtering: only the 5 docs containing "06" are processed ──────────────
    expect(processDocument).toHaveBeenCalledTimes(5);
    for (const doc of matchingDocuments) {
      expect(processDocument).toHaveBeenCalledWith(doc.Filename);
    }
    for (const doc of nonMatchingDocuments) {
      expect(processDocument).not.toHaveBeenCalledWith(doc.Filename);
    }

    // ── S3: one upload, correct key prefix, content-type, and CSV shape ───────
    expect(uploadToS3).toHaveBeenCalledTimes(1);
    const [s3Key, csvBuffer, contentType] = (uploadToS3 as jest.Mock).mock.calls[0] as [string, Buffer, string];
    expect(s3Key).toMatch(new RegExp(`^reports/${REPORT_ID}/`));
    expect(contentType).toBe('text/csv');
    const csvLines = csvBuffer.toString('utf-8').trim().split('\n');
    expect(csvLines).toHaveLength(6); // 1 header + 5 data rows
    expect(csvLines[0]).toBe('filename,processingResult');

    // ── ReportInstance: created once with documentCount 5 and correct S3 URL ──
    expect(ReportInstance.create).toHaveBeenCalledTimes(1);
    expect(ReportInstance.create).toHaveBeenCalledWith(
      expect.objectContaining({ documentCount: 5, s3Location: S3_URL })
    );

    // ── Event: emitted once with state "generated" and correct IDs ────────────
    expect(sendReportEventMessage).toHaveBeenCalledTimes(1);
    expect(sendReportEventMessage).toHaveBeenCalledWith({
      state: 'generated',
      reportId: REPORT_ID,
      reportInstanceId: INSTANCE_ID,
    });
  });

  it('does nothing when the report is not found', async () => {
    (Report.findById as jest.Mock).mockResolvedValue(null);

    await processReport(REPORT_ID);

    expect(processDocument).not.toHaveBeenCalled();
    expect(uploadToS3).not.toHaveBeenCalled();
    expect(ReportInstance.create).not.toHaveBeenCalled();
    expect(sendReportEventMessage).not.toHaveBeenCalled();
  });
});
