interface DonationRequest {
  amount?: string;
  message?: string;
  order_id?: string;
  wire_subject?: string;
  coin_pub?: string;
  txId?: string;
}

interface Env {
  TALER_EXCHANGE_URL?: string;
  TALER_MERCHANT_URL?: string;
  TALER_MERCHANT_PAYTO?: string;
  TALER_DONATION_CURRENCY?: string;
  TALER_DONATION_DEFAULT_AMOUNT?: string;
  TALER_DONATION_FULFILL_URL?: string;
  TALER_WIRED?: string;
}

export async function buildDonationOrder(env: Env, req: DonationRequest): Promise<Record<string, unknown>> {
  const currency = env.TALER_DONATION_CURRENCY || 'EUR';
  const amount = req.amount || env.TALER_DONATION_DEFAULT_AMOUNT || 'EUR:5';
  const payto = env.TALER_MERCHANT_PAYTO || 'payto://iban/placeholder';

  if (env.TALER_WIRED !== 'true' || !env.TALER_MERCHANT_URL) {
    return {
      mode: 'demo',
      payto_uri: payto,
      suggested_amount: amount,
      currency,
      message: 'Donation order (demo mode). Set TALER_WIRED=true for live Taler merchant integration.',
    };
  }

  try {
    const res = await fetch(`${env.TALER_MERCHANT_URL}/private/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: {
          summary: `P31 Labs Donation${req.message ? ': ' + req.message : ''}`,
          amount,
        },
      }),
    });
    const data = await res.json() as Record<string, unknown>;
    return { mode: 'live', ...data };
  } catch (e: any) {
    return { mode: 'demo', error: e.message, payto_uri: payto, suggested_amount: amount, currency };
  }
}

export async function fulfillDonation(env: Env, proof: DonationRequest): Promise<Record<string, unknown>> {
  return {
    receipt: `P31-donation-${Date.now()}`,
    amount: proof.amount || env.TALER_DONATION_DEFAULT_AMOUNT || 'EUR:5',
    timestamp: new Date().toISOString(),
    mode: env.TALER_WIRED === 'true' ? 'live' : 'demo',
  };
}
