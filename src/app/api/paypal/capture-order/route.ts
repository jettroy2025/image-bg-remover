// app/api/paypal/capture-order/route.ts
import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AQPiQrcz2gqE9EU70X1wL4-pJ3G7B-VhAjOjDj2Ray1--_ahGOfmLWQ93f8XIzGHn1e7jpZ7N33Z4r5g';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || 'EAdwS4p-C6iVI7N7cp7mn0WxLv2rvNP-JLOCb-bgDrqx80YtEfy5Wpx3DpsVBhthHoyYOLRMKx2osT4C';
const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

// 套餐配置
const PLANS: Record<string, { credits: number; name: string }> = {
  starter: { credits: 25, name: 'Starter' },
  pro: { credits: 50, name: 'Pro' },
  business: { credits: 125, name: 'Business' },
};

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
    const { orderId, planId } = await request.json();

    if (!orderId || !planId) {
      return NextResponse.json(
        { error: 'Missing orderId or planId' },
        { status: 400 }
      );
    }

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    // 捕获 PayPal 订单（完成支付）
    const response = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('PayPal capture order error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to capture order' },
        { status: response.status }
      );
    }

    // 检查支付状态
    if (data.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // TODO: 这里应该保存订单到数据库
    // 包括：用户ID、订单ID、套餐、额度、支付时间等

    return NextResponse.json({
      success: true,
      orderId: data.id,
      status: data.status,
      plan: plan,
      message: 'Payment successful',
    });
  } catch (error) {
    console.error('Capture order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
