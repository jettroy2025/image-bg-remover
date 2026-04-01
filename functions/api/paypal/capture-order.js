// functions/api/paypal/capture-order.js
export async function onRequestPost(context) {
  const { request, env } = context;
  
  const PAYPAL_CLIENT_ID = env.PAYPAL_CLIENT_ID || 'AQPiQrcz2gqE9EU70X1wL4-pJ3G7B-VhAjOjDj2Ray1--_ahGOfmLWQ93f8XIzGHn1e7jpZ7N33Z4r5g';
  const PAYPAL_SECRET = env.PAYPAL_SECRET || 'EAdwS4p-C6iVI7N7cp7mn0WxLv2rvNP-JLOCb-bgDrqx80YtEfy5Wpx3DpsVBhthHoyYOLRMKx2osT4C';
  const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

  try {
    const { orderId, planId } = await request.json();

    if (!orderId || !planId) {
      return new Response(JSON.stringify({ error: 'Missing orderId or planId' }), {
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

    // 捕获订单
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.message || 'Failed to capture order' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.status !== 'COMPLETED') {
      return new Response(JSON.stringify({ error: 'Payment not completed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      orderId: data.id,
      status: data.status,
      message: 'Payment successful',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
