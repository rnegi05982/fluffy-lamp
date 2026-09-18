import mongoose, { Schema, model, type Model } from 'mongoose';

export interface IStore {
  name: string;
  timezone: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, trim: true },
    timezone: { type: String, required: true },
    currency: { type: String, required: true },
  },
  { timestamps: true, collection: 'stores' },
);

// Case-insensitive unique name (collation strength 2 ignores case).
storeSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Store: Model<IStore> =
  (mongoose.models.Store as Model<IStore>) || model<IStore>('Store', storeSchema);
