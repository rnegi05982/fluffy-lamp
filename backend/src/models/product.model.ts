import mongoose, { Schema, model, Types, type Model } from 'mongoose';

export interface IVariant {
  variantId: string;
  name: string;
  price: Types.Decimal128;
}

export interface IProduct {
  name: string;
  productType: string;
  collections: string[];
  tags: string[];
  attributes: Record<string, unknown>;
  /** Catalog currency for the variant prices; the cashback engine ignores it. */
  currency: string;
  variants: IVariant[];
  createdAt: Date;
}

const variantSchema = new Schema<IVariant>(
  {
    variantId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    productType: { type: String, required: true },
    collections: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    attributes: { type: Schema.Types.Mixed, default: {} },
    currency: { type: String, required: true },
    variants: { type: [variantSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'products' },
);

export const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) || model<IProduct>('Product', productSchema);
