import mongoose from 'mongoose';

export interface IEvidenceMatch {
  requirementId: string;
  documentId?: string;
  evidence: string;
  confidence: number;
  verified?: boolean;
  explanation?: string;
}

const EvidenceSchema = new mongoose.Schema<IEvidenceMatch>({
  requirementId: { type: String, required: true, index: true },
  documentId: { type: String },
  evidence: { type: String, required: true },
  confidence: { type: Number, required: true },
  verified: { type: Boolean, default: false },
  explanation: { type: String },
}, { timestamps: true, strict: true });

EvidenceSchema.index({ requirementId: 1 });
EvidenceSchema.virtual('id').get(function(this: any) { return this.id ?? this._id?.toString(); });
EvidenceSchema.set('toJSON', { virtuals: true });
EvidenceSchema.set('toObject', { virtuals: true });

export const EvidenceModel = mongoose.models.Evidence || mongoose.model('Evidence', EvidenceSchema);
