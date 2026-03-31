'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// 简化的套餐配置
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 5,
    features: ['低清分辨率', '带水印', '7天历史记录'],
  },
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

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">加载中...</p>
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-gray-900">免费</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-500">/月</span>
                    </>
                  )}
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
                    ${plan.price === 0
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                  onClick={() => {
                    if (plan.id === 'free') {
                      window.location.href = '/';
                    } else {
                      alert('PayPal 支付即将接入');
                    }
                  }}
                >
                  {plan.price === 0 ? '免费使用' : '选择套餐'}
                </button>
              </div>
            </div>
          ))}
        </div>

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
