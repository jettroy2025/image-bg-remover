// functions/api/paypal/create-order.js
export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 生产环境 PayPal 配置
  const PAYPAL_CLIENT_ID = env.PAYPAL_CLIENT_ID || 'AcpK9pqxYiJRLbUr3PHxzGm_1cLyBNqzu6JYAdKxRzR0R6_xLcCV7JyE8z35NZhLNIBpMhv477uNAy9V';
  const PAYPAL_SECRET = env.PAYPAL_SECRET || 'EM_0fiwPW41J84X1NQXL7jK8JmFwvUjZiM9GQwORNDfom2OjNGSTnFXqvwwxb3717yE59hjLNAjrjiT5';
  const PAYPAL_API = 'https://api-m.paypal.com'; // 生产环境 API

  try {
    const { planId, price } = await request.json();

    if (!planId || !price) {
      return new Response(JSON.stringify({ error: 'Missing planId or price' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 获取 PayPal Access Token
    const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      return new Response(JSON.stringify({ error: tokenData.error_description || 'Failed to get access token' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const accessToken = tokenData.access_token;

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
      return new Response(JSON.stringify({ error: data.message || 'Failed to create order' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ orderId: data.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
