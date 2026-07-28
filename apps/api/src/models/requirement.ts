import mongoose from 'mongoose';

export interface IRequirement {
  opportunity_id: string;
  req_key: string;
  title: string;
  description?: string;
  type?: string;
  priority?: 'critical'|'high'|'medium'|'low';
  status?: string;
  source_text?: string;
  confidence?: number;
  dependencies?: string[];
}

const RequirementSchema = new mongoose.Schema<any>({
  opportunity_id: { type: String, required: true, index: true },
  req_key: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String },
  priority: { type: String, enum: ['critical','high','medium','low'] },
  status: { type: String },
  source_text: { type: String },
  confidence: { type: Number },
  dependencies: { type: [String], default: [] },
}, { timestamps: true, strict: true });

RequirementSchema.index({ opportunity_id: 1, req_key: 1 }, { unique: true });
RequirementSchema.virtual('id').get(function (this: any) { return this.id ?? this._id?.toString(); });
RequirementSchema.set('toJSON', { virtuals: true });
RequirementSchema.set('toObject', { virtuals: true });

export const RequirementModel = mongoose.models.Requirement || mongoose.model('Requirement', RequirementSchema);
