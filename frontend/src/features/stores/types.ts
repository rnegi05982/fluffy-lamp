export interface Store {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreBody {
  name: string;
  timezone: string;
  currency: string;
}
