import mongoose, { Schema, model, Types, type Model } from 'mongoose';

export interface ILineItem {
  productId: Types.ObjectId;
  variantId: string;
  quantity: number;
  /** Snapshot of the variant price at order time (informational). */
  unitPrice: Types.Decimal128 | null;
}

export interface IOrder {
  storeId: Types.ObjectId;
  customerId: Types.ObjectId;
  lineItems: ILineItem[];
  /** Authoritative cart total (manual on the order form). */
  orderAmount: Types.Decimal128;
  orderCurrency: string;
  /** Instant the order was placed (may be back/forward-dated in the simulator). */
  orderCreatedAt: Date;
  orderTimezone: string;
  createdAt: Date;
}

const lineItemSchema = new Schema<ILineItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Schema.Types.Decimal128, default: null },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    lineItems: { type: [lineItemSchema], default: [] },
    orderAmount: { type: Schema.Types.Decimal128, required: true },
    orderCurrency: { type: String, required: true },
    orderCreatedAt: { type: Date, required: true },
    orderTimezone: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'orders' },
);

export const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) || model<IOrder>('Order', orderSchema);
