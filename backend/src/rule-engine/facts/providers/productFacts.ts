export interface ProductMeta {
  productType: string;
  collections: string[];
  tags: string[];
}

/**
 * Product facts from the seeded catalog: which products/variants are in the cart, and the
 * union of their collections, tags, and types.
 */
export function productFacts(
  lineItems: { productId: string; variantId: string }[],
  productsById: Map<string, ProductMeta>,
): { sets: Record<string, string[]> } {
  const productIds = new Set<string>();
  const variantIds = new Set<string>();
  const collections = new Set<string>();
  const tags = new Set<string>();
  const types = new Set<string>();

  for (const li of lineItems) {
    productIds.add(li.productId);
    variantIds.add(li.variantId);
    const meta = productsById.get(li.productId);
    if (meta) {
      meta.collections.forEach((c) => collections.add(c));
      meta.tags.forEach((t) => tags.add(t));
      types.add(meta.productType);
    }
  }

  return {
    sets: {
      'product.specificProducts': [...productIds],
      'product.variants': [...variantIds],
      'product.collections': [...collections],
      'product.tags': [...tags],
      'product.types': [...types],
    },
  };
}
