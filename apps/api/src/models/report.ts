import mongoose from 'mongoose';

export interface IRecommendation { action: string; impact: number; reason: string; urgency: 'Now'|'Today'|'This week' }
export interface IReadinessReport {
  readiness: number;
  requirements: any[];
  documents: any[];
  matches: any[];
  risk: 'low'|'medium'|'high';
  riskReasons: string[];
  blockers: { title: string; chain: string[]; risk: 'high'|'medium' }[];
  contradictions: { field: string; values: string[]; action: string }[];
  recommendations: IRecommendation[];
}

const RecommendationSchema = new mongoose.Schema<any>({
  action: { type: String, required: true },
  impact: { type: Number, required: true },
  reason: { type: String, required: true },
  urgency: { type: String, enum: ['Now','Today','This week'], required: true },
}, { _id: false, strict: true });

const ReportSchema = new mongoose.Schema<any>({
  readiness: { type: Number, required: true },
  requirements: { type: [mongoose.Schema.Types.Mixed], default: [] },
  documents: { type: [mongoose.Schema.Types.Mixed], default: [] },
  matches: { type: [mongoose.Schema.Types.Mixed], default: [] },
  risk: { type: String, enum: ['low','medium','high'] },
  riskReasons: { type: [String], default: [] },
  blockers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  contradictions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  recommendations: { type: [RecommendationSchema], default: [] },
}, { timestamps: true, strict: true });

ReportSchema.virtual('id').get(function (this: any) { return this.id ?? this._id?.toString(); });
ReportSchema.set('toJSON', { virtuals: true });
ReportSchema.set('toObject', { virtuals: true });

export const ReportModel = mongoose.models.Report || mongoose.model('Report', ReportSchema);
