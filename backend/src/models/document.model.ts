import { Schema, model, Document } from 'mongoose';

export interface IDocument extends Document {
  Filename: string;
  FileLocation: string;
  Size: number;
  MD5: string;
}

const documentSchema = new Schema<IDocument>(
  {
    Filename: {
      type: String,
      required: true,
      trim: true,
    },
    FileLocation: {
      type: String,
      required: true,
    },
    Size: {
      type: Number,
      required: true,
    },
    MD5: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const DocumentModel = model<IDocument>('Document', documentSchema);
