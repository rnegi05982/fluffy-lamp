import { RuleOperator } from '../../domain/enums';

export type FactCategory = 'CUSTOMER' | 'CART' | 'PRODUCT';

/**
 * How a fact's value is entered/validated:
 * - customerTags/collections/productTags/productTypes/currency/products/variants: array of ids/codes (ANY-of)
 * - money: an amount in the campaign currency
 * - number: a plain number
 */
export type FactValueKind =
  | 'customerTags'
  | 'money'
  | 'number'
  | 'currency'
  | 'products'
  | 'variants'
  | 'collections'
  | 'productTags'
  | 'productTypes';

export interface FactDefinition {
  key: string;
  category: FactCategory;
  label: string;
  description: string;
  operators: RuleOperator[];
  valueKind: FactValueKind;
}

const { GTE, LTE, EQ, IS, IS_NOT } = RuleOperator;

/** The fixed catalog of eligibility facts (the only rules the editor can build). */
export const FACT_CATALOG: FactDefinition[] = [
  {
    key: 'customer.tags',
    category: 'CUSTOMER',
    label: 'Customer Tags',
    description: 'Must contain these tags',
    operators: [IS, IS_NOT],
    valueKind: 'customerTags',
  },
  {
    key: 'customer.lifetimeSpent',
    category: 'CUSTOMER',
    label: 'Customer Lifetime Spent',
    description: 'Total amount the customer has spent, including the current order',
    operators: [GTE, LTE, EQ],
    valueKind: 'money',
  },
  {
    key: 'cart.quantity',
    category: 'CART',
    label: 'Cart Quantity',
    description: 'Total items in the cart',
    operators: [GTE, LTE, EQ],
    valueKind: 'number',
  },
  {
    key: 'cart.total',
    category: 'CART',
    label: 'Cart Total',
    description: 'Total cart value (in the campaign currency)',
    operators: [GTE, LTE, EQ],
    valueKind: 'money',
  },
  {
    key: 'cart.currency',
    category: 'CART',
    label: 'Cart Currency',
    description: 'Cart currency must match',
    operators: [IS, IS_NOT],
    valueKind: 'currency',
  },
  {
    key: 'product.specificProducts',
    category: 'PRODUCT',
    label: 'Specific Products',
    description: 'Must include these products',
    operators: [IS, IS_NOT],
    valueKind: 'products',
  },
  {
    key: 'product.variants',
    category: 'PRODUCT',
    label: 'Products with Variants',
    description: 'Must include these variants',
    operators: [IS, IS_NOT],
    valueKind: 'variants',
  },
  {
    key: 'product.collections',
    category: 'PRODUCT',
    label: 'Product Collections',
    description: 'Cart includes items from these collections',
    operators: [IS, IS_NOT],
    valueKind: 'collections',
  },
  {
    key: 'product.tags',
    category: 'PRODUCT',
    label: 'Product Tags',
    description: 'With these tags',
    operators: [IS, IS_NOT],
    valueKind: 'productTags',
  },
  {
    key: 'product.types',
    category: 'PRODUCT',
    label: 'Product Types',
    description: 'Of these types',
    operators: [IS, IS_NOT],
    valueKind: 'productTypes',
  },
];

export const FACT_BY_KEY: Record<string, FactDefinition> = Object.fromEntries(
  FACT_CATALOG.map((f) => [f.key, f]),
);
