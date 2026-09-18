import { FACT_CATALOG, type FactDefinition } from '../../rule-engine/facts/catalog';
import {
  PRODUCT_COLLECTIONS,
  PRODUCT_TYPES,
  PRODUCT_TAGS,
  CUSTOMER_TAGS,
} from '../../rule-engine/facts/options';
import { CURRENCIES, type CurrencyRef } from '../reference/reference.data';

export interface FactCatalogResponse {
  facts: FactDefinition[];
  options: {
    currencies: CurrencyRef[];
    collections: string[];
    productTypes: string[];
    productTags: string[];
    customerTags: string[];
  };
}

/**
 * The fixed catalog metadata plus the bounded option lists the value pickers use. Large
 * value sets (specific products / variants) are not inlined — the frontend reads those from
 * the cached products list.
 */
export function getFactCatalog(): FactCatalogResponse {
  return {
    facts: FACT_CATALOG,
    options: {
      currencies: CURRENCIES,
      collections: PRODUCT_COLLECTIONS,
      productTypes: PRODUCT_TYPES,
      productTags: PRODUCT_TAGS,
      customerTags: CUSTOMER_TAGS,
    },
  };
}
