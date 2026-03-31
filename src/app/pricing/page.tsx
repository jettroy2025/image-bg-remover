'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PLANS, PlanId, User, getRemainingCredits, ANONYMOUS_LIMIT } from '@/lib/plans';

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);

  const handleSelectPlan = (planId: PlanId) => {
    if (planId === 'FREE') {
      window.location.href = '/';
      return;
    }
    // TODO: 接入 PayPal 支付
    alert(`即将跳转到 PayPal 支付 - ${PLANS[planId].name} 套餐`);
  };

  const currentPlanId = user?.plan || null;
  const remainingCredits = user ? getRemainingCredits(user) : ANONYMOUS_LIMIT.totalCredits;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            选择适合你的套餐
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            灵活的定价方案，满足不同需求。所有套餐均可随时升级、降级或取消。
          </p>
          
          {/* 当前额度显示 */}
          {user && (
            <div className="mt-6 inline-block bg-white rounded-lg px-6 py-3 shadow-md">
              <span className="text-gray-600">当前套餐：</span>
              <span className="font-semibold text-indigo-600">
                {PLANS[currentPlanId as PlanId]?.name || 'Free'}
              </span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-600">剩余额度：</span>
              <span className="font-semibold text-indigo-600">{remainingCredits} 张</span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([planId, plan]) => {
            const isCurrentPlan = currentPlanId === planId;
            const isFree = plan.price === 0;

            return (
              <div
                key={planId}
                className={`
                  relative bg-white rounded-2xl shadow-lg overflow-hidden
                  ${plan.popular ? 'ring-2 ring-indigo-500 scale-105' : ''}
                  ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}
                `}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    最受欢迎
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                    当前套餐
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-4">
                    {isFree ? (
                      <span className="text-3xl font-bold text-gray-900">免费</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-500">/月</span>
                      </>
                    )}
                  </div>

                  {/* Credits */}
                  <div className="mb-6">
                    <span className="text-2xl font-semibold text-indigo-600">
                      {plan.monthlyCredits}
                    </span>
                    <span className="text-gray-600"> 张/月</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6 text-sm">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>
                        {plan.features.resolution === 'high' ? '高清' : '低清'} 分辨率
                      </span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>
                        {plan.features.watermark ? '带水印' : '无水印'}
                      </span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>历史记录保存 {plan.features.historyDays} 天</span>
                    </li>
                    {plan.features.priority && (
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="font-medium text-indigo-600">优先处理</span>
                      </li>
                    )}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(planId as PlanId)}
                    disabled={isCurrentPlan}
                    className={`
                      w-full py-3 px-4 rounded-lg font-semibold transition-colors
                      ${isCurrentPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isFree
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {isCurrentPlan ? '当前套餐' : isFree ? '免费使用' : '选择套餐'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            常见问题
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">免费用户有什么限制？</h3>
              <p className="text-gray-600">
                免费用户每月可使用 5 张低分辨率带水印的图片。登录后可保存 7 天历史记录。
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">可以随时取消订阅吗？</h3>
              <p className="text-gray-600">
                是的，您可以随时取消订阅。取消后，您仍可使用当前套餐直到订阅期结束。
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">额度用完后怎么办？</h3>
              <p className="text-gray-600">
                您可以升级到更高套餐，或等待下月额度重置。未使用的额度不会累积到下月。
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
