import { Schema, model, Document, Types } from 'mongoose';

export interface IReportInstance extends Document {
  reportId: Types.ObjectId;
  s3Location: string;
  documentCount: number;
  generatedAt: Date;
}

const reportInstanceSchema = new Schema<IReportInstance>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    s3Location: {
      type: String,
      required: true,
    },
    documentCount: {
      type: Number,
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  { timestamps: false }
);

export const ReportInstance = model<IReportInstance>('ReportInstance', reportInstanceSchema);
