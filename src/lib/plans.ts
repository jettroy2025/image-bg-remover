// 用户套餐配置
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    monthlyCredits: 5,
    dailyCredits: null,
    popular: false,
    features: {
      resolution: 'low',      // 低分辨率
      watermark: true,        // 有水印
      historyDays: 7,         // 历史记录保存7天
      priority: false,        // 无优先处理
    },
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 7.99,
    monthlyCredits: 25,
    popular: false,
    features: {
      resolution: 'high',
      watermark: false,
      historyDays: 30,
      priority: false,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 14.99,
    monthlyCredits: 50,
    popular: true,            // 最受欢迎
    features: {
      resolution: 'high',
      watermark: false,
      historyDays: 90,
      priority: true,
    },
  },
  BUSINESS: {
    id: 'business',
    name: 'Business',
    price: 34.99,
    monthlyCredits: 125,
    popular: false,
    features: {
      resolution: 'high',
      watermark: false,
      historyDays: 365,
      priority: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

// 未登录用户限制
export const ANONYMOUS_LIMIT = {
  totalCredits: 3,           // 总共3次（不是每天）
  resolution: 'low',
  watermark: true,
};

// 用户类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  plan: PlanId;
  creditsUsed: number;       // 本月已使用额度
  creditsResetAt: string;    // 额度重置时间
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due';
  subscriptionEndAt?: string;
}

// 检查用户是否有足够额度
export function hasEnoughCredits(user: User | null): boolean {
  if (typeof window === 'undefined') return true; // SSR 时默认允许
  
  if (!user) {
    // 未登录用户检查本地存储的使用次数
    const anonymousUsed = parseInt(localStorage.getItem('anonymousCreditsUsed') || '0');
    return anonymousUsed < ANONYMOUS_LIMIT.totalCredits;
  }
  
  const plan = PLANS[user.plan];
  return user.creditsUsed < plan.monthlyCredits;
}

// 获取剩余额度
export function getRemainingCredits(user: User | null): number {
  if (typeof window === 'undefined') return ANONYMOUS_LIMIT.totalCredits; // SSR 时返回默认值
  
  if (!user) {
    const anonymousUsed = parseInt(localStorage.getItem('anonymousCreditsUsed') || '0');
    return Math.max(0, ANONYMOUS_LIMIT.totalCredits - anonymousUsed);
  }
  
  const plan = PLANS[user.plan];
  return Math.max(0, plan.monthlyCredits - user.creditsUsed);
}

// 使用一次额度
export function useCredit(user: User | null): void {
  if (!user) {
    const anonymousUsed = parseInt(localStorage.getItem('anonymousCreditsUsed') || '0');
    localStorage.setItem('anonymousCreditsUsed', String(anonymousUsed + 1));
  } else {
    // 实际使用时通过 API 扣减
    user.creditsUsed += 1;
    localStorage.setItem('user', JSON.stringify(user));
  }
}

// 检查是否需要重置额度（每月1号）
export function shouldResetCredits(user: User): boolean {
  const resetDate = new Date(user.creditsResetAt);
  const now = new Date();
  return resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear();
}

// 获取当前套餐信息
export function getCurrentPlan(user: User | null) {
  if (!user) return null;
  return PLANS[user.plan];
}
