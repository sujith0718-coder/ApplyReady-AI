import mongoose from 'mongoose';

export interface IDocument {
  opportunity_id: string;
  name: string;
  category?: string;
  verification_status?: 'verified'|'unverified'|'needs_review';
  extracted_text?: string;
  mime_type?: string;
  size?: number;
  path?: string;
  uploaded_at?: Date;
}

const DocumentSchema = new mongoose.Schema<any>({
  id: { type: String, index: true },
  opportunity_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String },
  verification_status: { type: String, enum: ['verified','unverified','needs_review'] },
  extracted_text: { type: String },
  mime_type: { type: String },
  size: { type: Number },
  path: { type: String },
  uploaded_at: { type: Date, default: () => new Date() },
}, { timestamps: true, strict: true });

DocumentSchema.index({ opportunity_id: 1 });
DocumentSchema.set('toJSON', { virtuals: true });
DocumentSchema.set('toObject', { virtuals: true });

export const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
