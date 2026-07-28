import mongoose from 'mongoose';

export interface IOpportunity {
  id?: string;
  title: string;
  deadline?: string;
  notice_text?: string;
}

const OpportunitySchema = new mongoose.Schema<any>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, index: true },
  deadline: { type: String },
  notice_text: { type: String },
}, { timestamps: true, strict: true });

OpportunitySchema.set('toJSON', { virtuals: true });
OpportunitySchema.set('toObject', { virtuals: true });

export const OpportunityModel = mongoose.models.Opportunity || mongoose.model('Opportunity', OpportunitySchema);
