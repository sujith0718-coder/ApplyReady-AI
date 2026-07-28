import mongoose from 'mongoose';

export interface IProfile {
  name: string;
  degree?: string;
  year?: number;
  cgpa?: number;
  skills?: string[];
}

const ProfileSchema = new mongoose.Schema<IProfile>({
  name: { type: String, required: true, trim: true, index: true },
  degree: { type: String },
  year: { type: Number },
  cgpa: { type: Number },
  skills: { type: [String], default: [] },
}, { timestamps: true, strict: true });

ProfileSchema.virtual('id').get(function (this: any) { return this.id ?? this._id?.toString(); });
ProfileSchema.set('toJSON', { virtuals: true });
ProfileSchema.set('toObject', { virtuals: true });

export const ProfileModel = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);
