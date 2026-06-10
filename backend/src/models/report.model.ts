import { Schema, model, Document, Types } from 'mongoose';

export interface IReport extends Document {
  userId: Types.ObjectId;
  name: string;
  filenamePattern: string;
  frequencyDays: number;
  enabled: boolean;
}

const reportSchema = new Schema<IReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    filenamePattern: {
      type: String,
      required: true,
      trim: true,
    },
    frequencyDays: {
      type: Number,
      required: true,
      default: 7,
      min: 1,
      max: 90,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

export const Report = model<IReport>('Report', reportSchema);
