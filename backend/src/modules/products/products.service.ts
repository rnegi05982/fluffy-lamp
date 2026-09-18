import { Types } from 'mongoose';
import { Product, type IProduct } from '../../models';
import type { Money } from '../../domain/money';

interface ProductShape extends IProduct {
  _id: Types.ObjectId;
}

export interface VariantDTO {
  variantId: string;
  name: string;
  price: Money;
}

export interface ProductDTO {
  id: string;
  name: string;
  productType: string;
  collections: string[];
  tags: string[];
  attributes: Record<string, unknown>;
  currency: string;
  variants: VariantDTO[];
  createdAt: Date;
}

function toProductDTO(product: ProductShape): ProductDTO {
  return {
    id: product._id.toString(),
    name: product.name,
    productType: product.productType,
    collections: product.collections,
    tags: product.tags,
    attributes: product.attributes,
    currency: product.currency,
    variants: product.variants.map((v) => ({
      variantId: v.variantId,
      name: v.name,
      price: { amount: v.price.toString(), currency: product.currency },
    })),
    createdAt: product.createdAt,
  };
}

/** Whole seeded catalog (unpaginated); the frontend caches + filters client-side. */
export async function listProducts(): Promise<ProductDTO[]> {
  const docs = await Product.find().sort({ name: 1 }).lean<ProductShape[]>();
  return docs.map(toProductDTO);
}
