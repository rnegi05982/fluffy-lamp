import mongoose, { Schema, model, Types, type Model } from 'mongoose';

export interface ICustomerStoreAccount {
  customerId: Types.ObjectId;
  storeId: Types.ObjectId;
  /** Delivered (available) balance, base currency. */
  balanceBase: Types.Decimal128;
  /** Scheduled but not yet delivered, base currency. */
  pendingBase: Types.Decimal128;
  /** Accumulated spend used by the lifetime-spent rule, base currency. */
  lifetimeSpent: Types.Decimal128;
  updatedAt: Date;
}

const customerStoreAccountSchema = new Schema<ICustomerStoreAccount>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    balanceBase: { type: Schema.Types.Decimal128, default: '0' },
    pendingBase: { type: Schema.Types.Decimal128, default: '0' },
    lifetimeSpent: { type: Schema.Types.Decimal128, default: '0' },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'customer_store_accounts' },
);

customerStoreAccountSchema.index({ customerId: 1, storeId: 1 }, { unique: true });

export const CustomerStoreAccount: Model<ICustomerStoreAccount> =
  (mongoose.models.CustomerStoreAccount as Model<ICustomerStoreAccount>) ||
  model<ICustomerStoreAccount>('CustomerStoreAccount', customerStoreAccountSchema);
