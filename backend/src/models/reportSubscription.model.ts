import { Schema, model, Document, Types } from 'mongoose';

export interface IReportSubscription extends Document {
  reportId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

const reportSubscriptionSchema = new Schema<IReportSubscription>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

reportSubscriptionSchema.index({ reportId: 1, userId: 1 }, { unique: true });

export const ReportSubscription = model<IReportSubscription>(
  'ReportSubscription',
  reportSubscriptionSchema
);
