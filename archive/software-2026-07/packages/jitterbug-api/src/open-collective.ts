import type { Env } from './index';

interface OCResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

interface Collective {
  id: number;
  slug: string;
  name: string;
  type: 'ORGANIZATION' | 'INDIVIDUAL';
  balance: { amount: number; currency: string };
  stats: { totalDonations: number; totalExpenses: number };
}

interface Transaction {
  id: number;
  type: 'CREDIT' | 'DEBIT';
  amount: { value: number; currency: string };
  description: string;
  createdAt: string;
}

interface Expense {
  id: number;
  status: 'UNPAID' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  amount: { value: number; currency: string };
  description: string;
  createdAt: string;
}

export class OpenCollectiveClient {
  private apiUrl: string;
  private token: string;

  constructor(env: Env) {
    this.apiUrl = env.OC_API_BASE || 'https://api.opencollective.com/graphql/v2';
    this.token = env.OC_PERSONAL_TOKEN || '';
  }

  private async request<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Personal-Token': this.token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`OC API error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as OCResponse<T>;
    if (json.errors) {
      const msgs = json.errors.map(e => e.message).join('; ');
      throw new Error(`OC GraphQL errors: ${msgs}`);
    }

    return json.data!;
  }

  async getCollective(slug: string): Promise<Collective | null> {
    const data = await this.request<{ account: Collective | null }>(`
      query($slug: String!) {
        account(slug: $slug) {
          id
          slug
          name
          type
          balance { amount currency }
          stats { totalDonations totalExpenses }
        }
      }
    `, { slug });
    return data.account;
  }

  async getTransactions(slug: string, limit = 50): Promise<Transaction[]> {
    const data = await this.request<{ account: { transactions: { nodes: Transaction[] } } }>(`
      query($slug: String!, $limit: Int!) {
        account(slug: $slug) {
          transactions(limit: $limit, orderBy: createdAt_DESC) {
            nodes {
              id
              type
              amount { value currency }
              description
              createdAt
            }
          }
        }
      }
    `, { slug, limit });
    return data.account.transactions.nodes;
  }

  async getExpenses(slug: string, limit = 20): Promise<Expense[]> {
    const data = await this.request<{ account: { expenses: { nodes: Expense[] } } }>(`
      query($slug: String!, $limit: Int!) {
        account(slug: $slug) {
          expenses(limit: $limit, orderBy: createdAt_DESC) {
            nodes {
              id
              status
              amount { value currency }
              description
              createdAt
            }
          }
        }
      }
    `, { slug, limit });
    return data.account.expenses.nodes;
  }

  async createExpense(input: {
    accountSlug: string;
    amount: number;
    currency: string;
    description: string;
    payeeEmail: string;
    category?: string;
  }): Promise<Expense> {
    const data = await this.request<{ createExpense: Expense }>(`
      mutation($input: ExpenseInput!) {
        createExpense(expense: $input) {
          id
          status
          amount { value currency }
          description
          createdAt
        }
      }
    `, {
      input: {
        account: { slug: input.accountSlug },
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        payee: { email: input.payeeEmail },
        category: input.category || 'OTHER',
      },
    });
    return data.createExpense;
  }

  async getFiscalHostStatus(slug: string): Promise<{ status?: string; fiscalHost?: { slug?: string } } | null> {
    const data = await this.request<{ account: { fiscalHost: { slug: string } | null } }>(`
      query($slug: String!) {
        account(slug: $slug) {
          fiscalHost { slug }
        }
      }
    `, { slug });
    return data.account as { status?: string; fiscalHost?: { slug?: string } } | null;
  }
}