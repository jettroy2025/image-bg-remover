// app/api/remove-bg/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 简单的内存存储（生产环境应该用 Redis 或数据库）
const ipUsageMap = new Map<string, { count: number; lastReset: number }>();
const ANONYMOUS_LIMIT = 3;
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24小时

// 获取客户端 IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  
  // 从 URL 或其他方式获取
  return 'unknown';
}

// 检查 IP 额度
function checkIPLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipUsageMap.get(ip);
  
  if (!record) {
    return { allowed: true, remaining: ANONYMOUS_LIMIT };
  }
  
  // 检查是否需要重置（超过24小时）
  if (now - record.lastReset > RESET_INTERVAL) {
    ipUsageMap.set(ip, { count: 0, lastReset: now });
    return { allowed: true, remaining: ANONYMOUS_LIMIT };
  }
  
  const remaining = Math.max(0, ANONYMOUS_LIMIT - record.count);
  return { allowed: remaining > 0, remaining };
}

// 增加 IP 使用次数
function incrementIPUsage(ip: string): void {
  const now = Date.now();
  const record = ipUsageMap.get(ip);
  
  if (!record || (now - record.lastReset > RESET_INTERVAL)) {
    ipUsageMap.set(ip, { count: 1, lastReset: now });
  } else {
    record.count += 1;
    ipUsageMap.set(ip, record);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取客户端 IP
    const clientIP = getClientIP(request);
    
    // 检查 IP 额度
    const limitCheck = checkIPLimit(clientIP);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: '免费额度已用完，请升级套餐',
          code: 'QUOTA_EXCEEDED',
          remaining: 0
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // 调用 Remove.bg API
    const apiFormData = new FormData();
    apiFormData.append('image_file', image);
    apiFormData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY || '',
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.errors?.[0]?.title || 'Failed to process image' },
        { status: response.status }
      );
    }

    // 获取处理后的图片
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // 增加 IP 使用次数
    incrementIPUsage(clientIP);
    const newRemaining = Math.max(0, limitCheck.remaining - 1);

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${base64}`,
      remaining: newRemaining,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取额度信息
export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  const limitCheck = checkIPLimit(clientIP);
  
  return NextResponse.json({
    remaining: limitCheck.remaining,
    total: ANONYMOUS_LIMIT,
    allowed: limitCheck.allowed,
  });
}
