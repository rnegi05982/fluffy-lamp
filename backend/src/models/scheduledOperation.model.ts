import mongoose, { Schema, model, Types, type Model } from 'mongoose';
import { ScheduledOperationType, ScheduledOperationStatus } from '../domain/enums';

export interface IScheduledOperation {
  type: ScheduledOperationType;
  status: ScheduledOperationStatus;
  /** When the op becomes due (UTC). */
  runAt: Date;
  transactionId: Types.ObjectId;
  /** Set when claimed into PROCESSING. */
  claimedAt: Date | null;
  attempts: number;
  failureReason: string | null;
  createdAt: Date;
  /** Set when moved to DONE or FAILED. */
  processedAt: Date | null;
}

const scheduledOperationSchema = new Schema<IScheduledOperation>(
  {
    type: { type: String, enum: Object.values(ScheduledOperationType), required: true },
    status: {
      type: String,
      enum: Object.values(ScheduledOperationStatus),
      default: ScheduledOperationStatus.PENDING,
    },
    runAt: { type: Date, required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    claimedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    failureReason: { type: String, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'scheduled_operations' },
);

// Hot path: claim due, pending ops.
scheduledOperationSchema.index({ status: 1, runAt: 1 });

export const ScheduledOperation: Model<IScheduledOperation> =
  (mongoose.models.ScheduledOperation as Model<IScheduledOperation>) ||
  model<IScheduledOperation>('ScheduledOperation', scheduledOperationSchema);
