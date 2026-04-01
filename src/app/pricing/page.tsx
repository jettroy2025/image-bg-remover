'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// PayPal Client ID (沙盒环境)
const PAYPAL_CLIENT_ID = 'AQPiQrcz2gqE9EU70X1wL4-pJ3G7B-VhAjOjDj2Ray1--_ahGOfmLWQ93f8XIzGHn1e7jpZ7N33Z4r5g';

// 套餐配置
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 7.99,
    credits: 25,
    features: ['高清分辨率', '无水印', '30天历史记录'],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 14.99,
    credits: 50,
    features: ['高清分辨率', '无水印', '90天历史记录', '优先处理'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 34.99,
    credits: 125,
    features: ['高清分辨率', '无水印', '365天历史记录', '优先处理'],
  },
];

// 全局类型声明
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: Error) => void;
      }) => { render: (element: HTMLElement | null) => void };
    };
  }
}

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载 PayPal SDK
  useEffect(() => {
    if (!mounted || !selectedPlan) return;

    // 检查脚本是否已加载
    if (document.getElementById('paypal-sdk')) {
      renderPayPalButton();
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = renderPayPalButton;
    script.onerror = () => {
      setError('PayPal 加载失败，请刷新页面重试');
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById('paypal-sdk');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [mounted, selectedPlan]);

  const renderPayPalButton = useCallback(() => {
    if (!window.paypal || !selectedPlan) return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    // 清空容器
    container.innerHTML = '';

    window.paypal
      .Buttons({
        createOrder: async () => {
          setLoading(true);
          setError(null);

          try {
            const response = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                planId: selectedPlan.id,
                price: selectedPlan.price,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || '创建订单失败');
            }

            return data.orderId;
          } catch (err) {
            setError(err instanceof Error ? err.message : '创建订单失败');
            setLoading(false);
            throw err;
          }
        },
        onApprove: async (data) => {
          try {
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderID,
                planId: selectedPlan.id,
              }),
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || '支付验证失败');
            }

            setSuccess(true);
            setLoading(false);

            // 保存用户套餐信息到本地存储
            try {
              localStorage.setItem('userPlan', JSON.stringify({
                planId: selectedPlan.id,
                credits: selectedPlan.credits,
                purchasedAt: new Date().toISOString(),
              }));
            } catch {
              console.log('localStorage not available');
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : '支付验证失败');
            setLoading(false);
          }
        },
        onError: (err) => {
          setError('PayPal 支付出错: ' + err.message);
          setLoading(false);
        },
      })
      .render(container);
  }, [selectedPlan]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 支付成功页面
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">支付成功！</h1>
            <p className="text-lg text-gray-600 mb-8">
              感谢购买 {selectedPlan?.name} 套餐
              <br />
              您现在可以使用 {selectedPlan?.credits} 张/月的额度
            </p>
            
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              开始使用
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            选择适合你的套餐
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            灵活的定价方案，满足不同需求
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative bg-white rounded-2xl shadow-lg overflow-hidden
                ${plan.popular ? 'ring-2 ring-indigo-500 scale-105' : ''}
              `}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  最受欢迎
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/月</span>
                </div>

                <div className="mb-6">
                  <span className="text-2xl font-semibold text-indigo-600">{plan.credits}</span>
                  <span className="text-gray-600"> 张/月</span>
                </div>

                <ul className="space-y-3 mb-6 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`
                    w-full py-3 px-4 rounded-lg font-semibold transition-colors
                    ${plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                  onClick={() => setSelectedPlan(plan)}
                >
                  选择套餐
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* PayPal Payment Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">确认订单</h2>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setError(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">套餐</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">额度</span>
                  <span className="font-semibold">{selectedPlan.credits} 张/月</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>总计</span>
                  <span className="text-indigo-600">${selectedPlan.price}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {loading && (
                <div className="mb-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">处理中...</p>
                </div>
              )}

              <div id="paypal-button-container"></div>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
