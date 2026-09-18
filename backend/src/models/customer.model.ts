import mongoose, { Schema, model, Types, type Model } from 'mongoose';

export interface ICustomer {
  firstName: string;
  lastName: string;
  email: string;
  /** Global, store-agnostic tags read by the rule engine. */
  tags: string[];
  /** Display preferences for the global (user) view. */
  timezone: string;
  currency: string;
  /** Cached global cashback balance across all stores, in base currency. */
  globalBalanceBase: Types.Decimal128;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    tags: { type: [String], default: [] },
    timezone: { type: String, required: true },
    currency: { type: String, required: true },
    globalBalanceBase: { type: Schema.Types.Decimal128, default: '0' },
  },
  { timestamps: true, collection: 'customers' },
);

customerSchema.index({ email: 1 }, { unique: true });

export const Customer: Model<ICustomer> =
  (mongoose.models.Customer as Model<ICustomer>) ||
  model<ICustomer>('Customer', customerSchema);
