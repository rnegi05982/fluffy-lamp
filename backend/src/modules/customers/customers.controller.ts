import type { Request, Response } from 'express';
import { validated } from '../../middleware/validate';
import {
  listCustomers,
  getCustomer,
  getBalance,
  getTransactions,
} from './customers.service';
import type {
  ListCustomersQuery,
  BalanceQuery,
  TransactionsQuery,
  CustomerIdParams,
} from './customers.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const { storeId } = validated<ListCustomersQuery>(req, 'query');
  const items = await listCustomers(storeId);
  res.json({ data: items });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = validated<CustomerIdParams>(req, 'params');
  const customer = await getCustomer(id);
  res.json({ data: customer });
}

export async function balance(req: Request, res: Response): Promise<void> {
  const { id } = validated<CustomerIdParams>(req, 'params');
  const query = validated<BalanceQuery>(req, 'query');
  const result = await getBalance(id, query);
  res.json({ data: result });
}

export async function transactions(req: Request, res: Response): Promise<void> {
  const { id } = validated<CustomerIdParams>(req, 'params');
  const query = validated<TransactionsQuery>(req, 'query');
  const { items, meta } = await getTransactions(id, query);
  res.json({ data: items, meta });
}
