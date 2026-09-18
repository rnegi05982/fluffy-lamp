import { Types } from 'mongoose';
import {
  Customer,
  CustomerStoreAccount,
  Store,
  Transaction,
  Campaign,
} from '../../models';
import { ApiError } from '../../lib/ApiError';
import { toStringValue } from '../../lib/money/decimal';
import { convertFromBase } from '../../lib/money/fx';
import { FX_RATES } from '../reference/reference.data';
import { buildMeta, type PageMeta } from '../../lib/pagination';
import type { Money } from '../../domain/money';
import type { BalanceQuery, TransactionsQuery } from './customers.validation';

function money(baseAmount: Types.Decimal128 | string, currency: string): Money {
  return { amount: toStringValue(convertFromBase(baseAmount, currency, FX_RATES)), currency };
}

// ---- list ------------------------------------------------------------------

export async function listCustomers(storeId?: string): Promise<unknown[]> {
  const customers = await Customer.find()
    .sort({ firstName: 1, lastName: 1 })
    .lean<
      Array<{
        _id: Types.ObjectId;
        firstName: string;
        lastName: string;
        email: string;
        tags: string[];
      }>
    >();

  if (!storeId) {
    return customers.map((c) => ({
      id: c._id.toString(),
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      tags: c.tags,
    }));
  }

  const store = await Store.findById(storeId).lean<{ currency: string } | null>();
  if (!store) throw ApiError.notFound('STORE_NOT_FOUND', 'Store not found');

  const storeObjId = new Types.ObjectId(storeId);
  const [accounts, lastCredits] = await Promise.all([
    CustomerStoreAccount.find({ storeId: storeObjId }).lean<
      Array<{ customerId: Types.ObjectId; balanceBase: Types.Decimal128 }>
    >(),
    Transaction.aggregate<{ _id: Types.ObjectId; last: Date }>([
      { $match: { storeId: storeObjId, type: 'COMPLETED' } },
      { $group: { _id: '$customerId', last: { $max: { $ifNull: ['$deliverAt', '$createdAt'] } } } },
    ]),
  ]);

  const balanceByCustomer = new Map(accounts.map((a) => [a.customerId.toString(), a.balanceBase]));
  const lastByCustomer = new Map(lastCredits.map((r) => [r._id.toString(), r.last]));

  return customers.map((c) => {
    const id = c._id.toString();
    return {
      id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      tags: c.tags,
      storeBalance: money(balanceByCustomer.get(id) ?? '0', store.currency),
      storeCurrency: store.currency,
      lastCreditedAt: lastByCustomer.get(id) ?? null,
    };
  });
}

// ---- detail ----------------------------------------------------------------

export async function getCustomer(id: string): Promise<unknown> {
  const c = await Customer.findById(id).lean<{
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    tags: string[];
    currency: string;
    timezone: string;
  } | null>();
  if (!c) throw ApiError.notFound('CUSTOMER_NOT_FOUND', 'Customer not found');
  return {
    id: c._id.toString(),
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    tags: c.tags,
    currency: c.currency,
    timezone: c.timezone,
  };
}

// ---- balance ---------------------------------------------------------------

export async function getBalance(id: string, query: BalanceQuery): Promise<unknown> {
  const customer = await Customer.findById(id).lean<{
    globalBalanceBase: Types.Decimal128;
    currency: string;
    timezone: string;
  } | null>();
  if (!customer) throw ApiError.notFound('CUSTOMER_NOT_FOUND', 'Customer not found');

  const customerId = new Types.ObjectId(id);

  if (query.storeId) {
    const store = await Store.findById(query.storeId).lean<{
      currency: string;
      timezone: string;
    } | null>();
    if (!store) throw ApiError.notFound('STORE_NOT_FOUND', 'Store not found');
    const account = await CustomerStoreAccount.findOne({
      customerId,
      storeId: new Types.ObjectId(query.storeId),
    }).lean<{ balanceBase: Types.Decimal128; pendingBase: Types.Decimal128 } | null>();
    return {
      view: 'store',
      currency: store.currency,
      timezone: store.timezone,
      balance: money(account?.balanceBase ?? '0', store.currency),
      pending: money(account?.pendingBase ?? '0', store.currency),
    };
  }

  const [pendingAgg] = await CustomerStoreAccount.aggregate<{ pending: Types.Decimal128 }>([
    { $match: { customerId } },
    { $group: { _id: null, pending: { $sum: '$pendingBase' } } },
  ]);
  return {
    view: 'user',
    currency: customer.currency,
    timezone: customer.timezone,
    balance: money(customer.globalBalanceBase, customer.currency),
    pending: money(pendingAgg?.pending ?? '0', customer.currency),
  };
}

// ---- transactions ----------------------------------------------------------

interface TxShape {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  campaignId: Types.ObjectId | null;
  type: string;
  originalAmount: Types.Decimal128;
  originalCurrency: string;
  baseAmount: Types.Decimal128;
  deliverAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export async function getTransactions(
  id: string,
  query: TransactionsQuery,
): Promise<{ items: unknown[]; meta: PageMeta }> {
  const { storeId, type, page, limit } = query;

  const customer = await Customer.findById(id).lean<{ currency: string } | null>();
  if (!customer) throw ApiError.notFound('CUSTOMER_NOT_FOUND', 'Customer not found');

  let viewCurrency = customer.currency;
  if (storeId) {
    const store = await Store.findById(storeId).lean<{ currency: string } | null>();
    if (!store) throw ApiError.notFound('STORE_NOT_FOUND', 'Store not found');
    viewCurrency = store.currency;
  }

  const filter: Record<string, unknown> = { customerId: new Types.ObjectId(id) };
  if (storeId) filter.storeId = new Types.ObjectId(storeId);
  if (type) filter.type = type;

  const [docs, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<TxShape[]>(),
    Transaction.countDocuments(filter),
  ]);

  // Resolve campaign names (and store names for the global view) for this page.
  const campaignIds = [...new Set(docs.filter((d) => d.campaignId).map((d) => String(d.campaignId)))];
  const campaigns = await Campaign.find({ _id: { $in: campaignIds } }).lean<
    Array<{ _id: Types.ObjectId; campaignName: string }>
  >();
  const campaignName = new Map(campaigns.map((c) => [c._id.toString(), c.campaignName]));

  const storeName = new Map<string, string>();
  if (!storeId) {
    const storeIds = [...new Set(docs.map((d) => d.storeId.toString()))];
    const stores = await Store.find({ _id: { $in: storeIds } }).lean<
      Array<{ _id: Types.ObjectId; name: string }>
    >();
    stores.forEach((s) => storeName.set(s._id.toString(), s.name));
  }

  const items = docs.map((d) => ({
    id: d._id.toString(),
    type: d.type,
    campaignId: d.campaignId ? d.campaignId.toString() : null,
    campaignName: d.campaignId ? (campaignName.get(d.campaignId.toString()) ?? null) : null,
    ...(storeId
      ? {}
      : { storeId: d.storeId.toString(), storeName: storeName.get(d.storeId.toString()) ?? null }),
    amount: money(d.baseAmount, viewCurrency),
    originalAmount: { amount: d.originalAmount.toString(), currency: d.originalCurrency },
    deliverAt: d.deliverAt,
    expiresAt: d.expiresAt,
    createdAt: d.createdAt,
  }));

  return { items, meta: buildMeta(page, limit, total) };
}
