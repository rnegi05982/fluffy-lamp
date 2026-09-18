import { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { logger } from '../lib/logger';
import {
  Store,
  Customer,
  Product,
  Campaign,
  Order,
  Transaction,
  CustomerStoreAccount,
  ScheduledOperation,
} from '../models';
import type { RuleGroup, RuleNode } from '../domain/rule-tree';

/** Build a flat AND/OR group from leaf rules. */
function group(operator: 'AND' | 'OR', rules: RuleNode[]): RuleGroup {
  return { type: 'GROUP', operator, children: rules };
}

function rule(fact: string, operator: string, value: unknown, params?: Record<string, unknown>): RuleNode {
  return { type: 'RULE', fact, operator: operator as never, value, ...(params ? { params } : {}) };
}

function fixed(amount: string): Types.Decimal128 {
  return Types.Decimal128.fromString(amount);
}

async function seed(): Promise<void> {
  await connectDB();

  // Clean slate across every collection.
  await Promise.all([
    Store.deleteMany({}),
    Customer.deleteMany({}),
    Product.deleteMany({}),
    Campaign.deleteMany({}),
    Order.deleteMany({}),
    Transaction.deleteMany({}),
    CustomerStoreAccount.deleteMany({}),
    ScheduledOperation.deleteMany({}),
  ]);

  const [aurora, kyoto, thames] = await Store.create([
    { name: 'Aurora Outfitters', timezone: 'America/New_York', currency: 'USD' },
    { name: 'Kyoto Living', timezone: 'Asia/Tokyo', currency: 'JPY' },
    { name: 'Thames & Co', timezone: 'Europe/London', currency: 'GBP' },
  ]);
  if (!aurora || !kyoto || !thames) throw new Error('Failed to create seed stores');

  await Customer.create([
    { firstName: 'Ava', lastName: 'Chen', email: 'ava@example.com', tags: ['vip'], timezone: 'America/New_York', currency: 'USD' },
    { firstName: 'Liam', lastName: 'Patel', email: 'liam@example.com', tags: ['new'], timezone: 'Asia/Kolkata', currency: 'INR' },
    { firstName: 'Noah', lastName: 'Kim', email: 'noah@example.com', tags: [], timezone: 'Asia/Singapore', currency: 'SGD' },
    { firstName: 'Mia', lastName: 'Garcia', email: 'mia@example.com', tags: ['vip', 'wholesale'], timezone: 'Europe/Paris', currency: 'EUR' },
    { firstName: 'Emma', lastName: 'Suzuki', email: 'emma@example.com', tags: ['new'], timezone: 'Asia/Tokyo', currency: 'JPY' },
  ]);

  const [tshirt, sneakers, backpack, bottle, jacket, cap] = await Product.create([
    { name: 'Classic Tee', productType: 'apparel', collections: ['summer'], tags: ['eco'], currency: 'USD',
      variants: [
        { variantId: 'tee-s', name: 'Small', price: fixed('20.00') },
        { variantId: 'tee-m', name: 'Medium', price: fixed('20.00') },
        { variantId: 'tee-l', name: 'Large', price: fixed('22.00') },
      ] },
    { name: 'Trail Sneakers', productType: 'footwear', collections: ['outdoor'], tags: [], currency: 'USD',
      variants: [
        { variantId: 'sneak-42', name: 'EU 42', price: fixed('89.00') },
        { variantId: 'sneak-44', name: 'EU 44', price: fixed('89.00') },
      ] },
    { name: 'Daypack 20L', productType: 'accessories', collections: ['outdoor'], tags: ['eco'], currency: 'USD',
      variants: [{ variantId: 'pack-std', name: 'Standard', price: fixed('60.00') }] },
    { name: 'Steel Bottle', productType: 'accessories', collections: ['summer'], tags: ['eco'], currency: 'USD',
      variants: [{ variantId: 'bottle-500', name: '500ml', price: fixed('18.00') }] },
    { name: 'Rain Jacket', productType: 'apparel', collections: ['outdoor'], tags: [], currency: 'USD',
      variants: [
        { variantId: 'jacket-m', name: 'Medium', price: fixed('120.00') },
        { variantId: 'jacket-l', name: 'Large', price: fixed('120.00') },
      ] },
    { name: 'Logo Cap', productType: 'accessories', collections: ['summer'], tags: [], currency: 'USD',
      variants: [{ variantId: 'cap-os', name: 'One Size', price: fixed('25.00') }] },
  ]);
  if (!tshirt || !cap) throw new Error('Failed to create seed products');
  void [sneakers, backpack, bottle, jacket];

  await Campaign.create([
    // Aurora: continuous, credited immediately, never expires. One % tier over $50.
    {
      storeId: aurora._id,
      campaignName: 'Summer Saver',
      isEnabled: true,
      timezone: aurora.timezone,
      startAt: null,
      endAt: null,
      deliveryMode: 'IMMEDIATE',
      expiryMode: 'NEVER',
      currency: null,
      tiers: [
        {
          tierId: 't1',
          rank: 1,
          valueType: 'PERCENTAGE',
          value: 10,
          ruleGroup: group('AND', [rule('cart.total', 'GTE', '50', { currency: 'USD' })]),
        },
      ],
    },
    // Aurora: scheduled window, delayed 2 days @10:00, expires 30 days @23:59. Two ranked tiers.
    {
      storeId: aurora._id,
      campaignName: 'VIP Rewards',
      isEnabled: true,
      timezone: aurora.timezone,
      startAt: new Date('2026-09-01T00:00:00Z'),
      endAt: new Date('2026-12-31T23:59:59Z'),
      deliveryMode: 'AFTER_DAYS',
      deliveryDays: 2,
      deliveryTime: '10:00',
      expiryMode: 'AFTER_DAYS',
      expiryDays: 30,
      expiryTime: '23:59',
      currency: 'USD',
      tiers: [
        {
          tierId: 't1',
          rank: 1,
          valueType: 'FIXED',
          value: fixed('25.00'),
          ruleGroup: group('AND', [rule('customer.tags', 'IS', ['vip'])]),
        },
        {
          tierId: 't2',
          rank: 2,
          valueType: 'PERCENTAGE',
          value: 5,
          ruleGroup: group('AND', [rule('cart.total', 'GTE', '100', { currency: 'USD' })]),
        },
      ],
    },
    // Kyoto: continuous, immediate, expires in 14 days. Product-membership rule.
    {
      storeId: kyoto._id,
      campaignName: 'Tokyo Launch',
      isEnabled: true,
      timezone: kyoto.timezone,
      startAt: null,
      endAt: null,
      deliveryMode: 'IMMEDIATE',
      expiryMode: 'AFTER_DAYS',
      expiryDays: 14,
      expiryTime: '12:00',
      currency: null,
      tiers: [
        {
          tierId: 't1',
          rank: 1,
          valueType: 'PERCENTAGE',
          value: 8,
          ruleGroup: group('OR', [
            rule('product.specificProducts', 'IS', [tshirt._id.toString(), cap._id.toString()]),
          ]),
        },
      ],
    },
    // Thames: disabled draft, to exercise the disabled phase.
    {
      storeId: thames._id,
      campaignName: 'Autumn Preview',
      isEnabled: false,
      timezone: thames.timezone,
      startAt: null,
      endAt: null,
      deliveryMode: 'IMMEDIATE',
      expiryMode: 'NEVER',
      currency: null,
      tiers: [
        {
          tierId: 't1',
          rank: 1,
          valueType: 'PERCENTAGE',
          value: 12,
          ruleGroup: group('AND', [rule('cart.quantity', 'GTE', 3)]),
        },
      ],
    },
  ]);

  logger.info('Seed complete', {
    stores: 3,
    customers: 5,
    products: 6,
    campaigns: 4,
  });

  await disconnectDB();
}

seed().catch((err) => {
  logger.error('Seed failed', err);
  process.exit(1);
});
