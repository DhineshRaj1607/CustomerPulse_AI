export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export type Customer = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpend: number;
  lastPurchaseDate?: string;
  // legacy support for older records
  lastPurchase?: string;
  segment?: string;
  createdAt?: string;
};

export type Segment = {
  _id: string;
  name: string;
  conditions: string[];
  estimatedReach: number;
  createdAt?: string;
};

export type Campaign = {
  _id: string;
  campaignName: string;
  segment: string;
  channels: string[];
  message: string;
  estimatedReach?: number;
  status: string;
  sentCount?: number;
  sentDate?: string;
  scheduledDate?: string;
  createdAt?: string;
};

export type AnalyticsResponse = {
  totalCustomers: number;
  activeSegments: number;
  campaignsSent: number;
  avgOpenRate: number;
};

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message = json?.message || response.statusText || 'API request failed';
    throw new Error(message);
  }

  return json as T;
}

const normalizeCustomer = (item: any): Customer => ({
  ...item,
  totalSpend: item.totalSpend ?? item.totalSpent ?? 0,
  lastPurchaseDate: item.lastPurchaseDate ?? item.lastPurchase ?? undefined,
});

export const getCustomers = async () => {
  const data = await fetchJson<any[]>('/api/customers');
  return data.map(normalizeCustomer) as Customer[];
};
export const deleteCustomer = (id: string) =>
  fetchJson<{ message: string }>(`/api/customers/${id}`, {
    method: 'DELETE',
  });
export const getSegments = () => fetchJson<Segment[]>('/api/segments');
export const deleteSegment = (id: string) =>
  fetchJson<{ message: string }>(`/api/segments/${id}`, {
    method: 'DELETE',
  });
export const getCampaigns = () => fetchJson<Campaign[]>('/api/campaigns');
export const getAnalytics = () => fetchJson<AnalyticsResponse>('/api/analytics');
export const createSegment = (segment: Omit<Segment, '_id' | 'createdAt'>) =>
  fetchJson<Segment>('/api/segments', {
    method: 'POST',
    body: JSON.stringify(segment),
  });
export const createCustomer = async (customer: Omit<Customer, '_id' | 'createdAt'>) => {
  const created = await fetchJson<any>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
  return normalizeCustomer(created);
};

export const updateCustomer = async (id: string, customer: Omit<Customer, '_id' | 'createdAt'>) => {
  const updated = await fetchJson<any>(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customer),
  });
  return normalizeCustomer(updated);
};

export const createCampaign = (campaign: Omit<Campaign, '_id' | 'createdAt'>) =>
  fetchJson<Campaign>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(campaign),
  });

export const sendEmailCampaign = (payload: { campaignName: string; message: string; segment: string }) =>
  fetchJson<{ success: boolean; sent: number; errors?: string[] }>('/api/campaigns/send-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

console.log("API_BASE_URL =", API_BASE_URL);
console.log("CUSTOMERS URL =", `${API_BASE_URL}/api/customers`);