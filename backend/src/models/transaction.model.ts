import mongoose, { Schema, model, Types, type Model } from 'mongoose';
import { TransactionType } from '../domain/enums';

export interface ITransaction {
  customerId: Types.ObjectId;
  storeId: Types.ObjectId;
  orderId: Types.ObjectId;
  /** Campaign that granted the cashback; null for reversals not tied to one. */
  campaignId: Types.ObjectId | null;
  /** For an EXPIRED reversal, the credit it reverses. */
  sourceTransactionId: Types.ObjectId | null;
  type: TransactionType;
  originalAmount: Types.Decimal128;
  originalCurrency: string;
  fxRate: number;
  /** Signed base-currency amount (negative for reversals). */
  baseAmount: Types.Decimal128;
  deliverAt: Date | null;
  expiresAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null },
    sourceTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', default: null },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    originalAmount: { type: Schema.Types.Decimal128, required: true },
    originalCurrency: { type: String, required: true },
    fxRate: { type: Number, required: true },
    baseAmount: { type: Schema.Types.Decimal128, required: true },
    deliverAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'transactions' },
);

transactionSchema.index({ customerId: 1, storeId: 1 });

export const Transaction: Model<ITransaction> =
  (mongoose.models.Transaction as Model<ITransaction>) ||
  model<ITransaction>('Transaction', transactionSchema);
