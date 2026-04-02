// PayPal WebHook Handler - Cloudflare Function
// 用于接收 PayPal 支付状态通知

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // 获取 WebHook 数据
    const body = await request.text();
    const headers = request.headers;
    
    // 验证 WebHook 签名（生产环境应该验证）
    // const isValid = await verifyPayPalWebhook(body, headers, env);
    // if (!isValid) {
    //   return new Response('Invalid signature', { status: 400 });
    // }
    
    const event = JSON.parse(body);
    
    console.log('PayPal WebHook received:', event.event_type);
    
    // 处理不同的事件类型
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
      case 'CHECKOUT.ORDER.COMPLETED':
        // 支付完成，更新用户额度
        await handlePaymentCompleted(event, env);
        break;
        
      case 'CHECKOUT.ORDER.CANCELLED':
        // 支付取消
        console.log('Payment cancelled:', event.resource?.id);
        break;
        
      case 'CUSTOMER.DISPUTE.CREATED':
        // 争议创建
        console.log('Dispute created:', event.resource?.id);
        break;
        
      case 'PAYMENT.CAPTURE.REFUNDED':
        // 退款处理
        console.log('Payment refunded:', event.resource?.id);
        break;
        
      default:
        console.log('Unhandled event type:', event.event_type);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('WebHook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 处理支付完成
async function handlePaymentCompleted(event, env) {
  const resource = event.resource;
  const orderId = resource?.id;
  
  // 从 custom_id 或 description 中获取套餐信息
  const customId = resource?.purchase_units?.[0]?.custom_id;
  const description = resource?.purchase_units?.[0]?.description;
  
  console.log('Payment completed:', {
    orderId,
    customId,
    description,
    amount: resource?.purchase_units?.[0]?.amount?.value,
  });
  
  // TODO: 在这里更新数据库中的用户额度
  // 例如：调用数据库 API 给用户添加额度
  
  // 示例：发送通知（可选）
  // await sendNotification(env, {
  //   type: 'payment_completed',
  //   orderId,
  //   amount: resource?.purchase_units?.[0]?.amount?.value,
  // });
}

// 验证 PayPal WebHook 签名（生产环境建议启用）
async function verifyPayPalWebhook(body, headers, env) {
  // 获取 PayPal 传输头
  const transmissionId = headers.get('paypal-transmission-id');
  const certId = headers.get('paypal-cert-id');
  const signature = headers.get('paypal-transmission-sig');
  const timestamp = headers.get('paypal-transmission-time');
  
  if (!transmissionId || !certId || !signature || !timestamp) {
    return false;
  }
  
  // 构建验证数据
  const authAlgo = headers.get('paypal-auth-algo') || 'SHA256withRSA';
  const expectedSig = `${transmissionId}|${timestamp}|${env.PAYPAL_WEBHOOK_ID}|${authAlgo}`;
  
  // TODO: 使用 PayPal 公钥验证签名
  // 这里简化处理，生产环境需要完整实现
  
  return true; // 简化验证，生产环境请完善
}
