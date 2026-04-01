// app/api/paypal/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AQPiQrcz2gqE9EU70X1wL4-pJ3G7B-VhAjOjDj2Ray1--_ahGOfmLWQ93f8XIzGHn1e7jpZ7N33Z4r5g';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || 'EAdwS4p-C6iVI7N7cp7mn0WxLv2rvNP-JLOCb-bgDrqx80YtEfy5Wpx3DpsVBhthHoyYOLRMKx2osT4C';
const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

// 获取 PayPal Access Token
async function getAccessToken(): Promise<string> {
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error_description || 'Failed to get access token');
  }

  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { planId, price } = await request.json();

    if (!planId || !price) {
      return NextResponse.json(
        { error: 'Missing planId or price' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    // 创建 PayPal 订单
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: price.toString(),
            },
            description: `Image Background Remover - ${planId} Plan`,
            custom_id: planId,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PayPal create order error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to create order' },
        { status: response.status }
      );
    }

    return NextResponse.json({ orderId: data.id });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
