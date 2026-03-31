'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  hasEnoughCredits, 
  getRemainingCredits, 
  ANONYMOUS_LIMIT,
  PLANS 
} from '@/lib/plans';

// 全局 window 类型扩展
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (element: HTMLElement | null, options: { theme: string; size: string }) => void;
        };
      };
    };
  }

  interface GoogleCredentialResponse {
    credential: string;
  }
}

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [remainingCredits, setRemainingCredits] = useState(ANONYMOUS_LIMIT.totalCredits);

  // 更新剩余额度显示
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRemainingCredits(getRemainingCredits(user));
    }
  }, [user]);

  // 处理 Google 登录回调
  const handleGoogleCallback = useCallback((response: GoogleCredentialResponse) => {
    const token = response.credential;
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    const userData: User = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      image: payload.picture,
      plan: 'FREE',
      creditsUsed: 0,
      creditsResetAt: new Date().toISOString(),
    };
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  }, []);

  // 退出登录
  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('anonymousCreditsUsed');
    window.location.reload();
  }, []);

  // 加载 Google Identity Services
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && !savedUser) {
        window.google.accounts.id.initialize({
          client_id: '1060110837421-360r8rj0lmu5c5vo9jsfu8bs5i2njmv6.apps.googleusercontent.com',
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large' }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [handleGoogleCallback]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查额度
    if (!hasEnoughCredits(user)) {
      setError('额度已用完，请升级套餐');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件 (JPG/PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setFileName(file.name);
    setError(null);
    setProcessedImage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    processImage(file);
  }, [user]);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '处理失败');
      }

      setProcessedImage(data.image);
      
      // 扣减额度
      if (!user) {
        const anonymousUsed = parseInt(localStorage.getItem('anonymousCreditsUsed') || '0');
        localStorage.setItem('anonymousCreditsUsed', String(anonymousUsed + 1));
      } else {
        user.creditsUsed += 1;
        localStorage.setItem('user', JSON.stringify(user));
      }
      setRemainingCredits(getRemainingCredits(user));
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.getElementById('file-input') as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [handleFileChange]);

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `removed-bg-${fileName || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 获取当前套餐名称
  const getPlanName = () => {
    if (!user) return '访客';
    const planKey = user.plan.toUpperCase() as keyof typeof PLANS;
    return PLANS[planKey]?.name || 'Free';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            {/* Credits Display */}
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-md text-sm">
                <span className="text-gray-600">套餐：</span>
                <span className="font-semibold text-indigo-600">{getPlanName()}</span>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-md text-sm">
                <span className="text-gray-600">剩余额度：</span>
                <span className={`font-semibold ${remainingCredits === 0 ? 'text-red-500' : 'text-indigo-600'}`}>
                  {remainingCredits} 张
                </span>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link 
                href="/pricing"
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
              >
                升级套餐
              </Link>
              {user ? (
                <div className="flex items-center gap-3">
                  {user.image && (
                    <img 
                      src={user.image} 
                      alt="头像" 
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700 hidden sm:inline">
                    {user.name}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div id="google-signin-button"></div>
              )}
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Image Background Remover
          </h1>
          <p className="text-lg text-gray-600">
            AI 智能抠图，3秒去除背景
          </p>
        </div>

        {/* Upload Area */}
        {!originalImage && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`
              border-4 border-dashed rounded-3xl p-16 text-center bg-white shadow-lg transition-colors cursor-pointer
              ${remainingCredits === 0 
                ? 'border-red-300 hover:border-red-500' 
                : 'border-indigo-300 hover:border-indigo-500'
              }
            `}
            onClick={() => {
              if (remainingCredits === 0) {
                window.location.href = '/pricing';
              } else {
                document.getElementById('file-input')?.click();
              }
            }}
          >
            <div className="text-6xl mb-4">
              {remainingCredits === 0 ? '🔒' : '📤'}
            </div>
            <p className="text-xl text-gray-700 mb-2">
              {remainingCredits === 0 ? '额度已用完，点击升级套餐' : '拖拽图片到这里，或点击上传'}
            </p>
            <p className="text-sm text-gray-500">
              {remainingCredits === 0 
                ? '升级后可继续使用' 
                : `支持 JPG、PNG 格式，最大 5MB（剩余 ${remainingCredits} 张）`
              }
            </p>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={remainingCredits === 0}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
            {error.includes('额度') && (
              <div className="mt-2">
                <Link 
                  href="/pricing"
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  查看套餐
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">AI 正在处理中...</p>
          </div>
        )}

        {/* Result Comparison */}
        {originalImage && processedImage && !isProcessing && (
          <div className="mt-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Original */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                  原图
                </h3>
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Processed */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                  去背景后
                </h3>
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={processedImage}
                    alt="Processed"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleDownload}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-colors text-lg"
              >
                ⬇️ 下载 PNG 图片
              </button>
            </div>

            {/* Reset Button */}
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setOriginalImage(null);
                  setProcessedImage(null);
                  setError(null);
                  setFileName('');
                }}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                处理新图片
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>纯内存处理，图片不会保存到服务器</p>
          <p className="mt-2">Powered by Remove.bg API</p>
        </div>
      </div>
    </main>
  );
}
