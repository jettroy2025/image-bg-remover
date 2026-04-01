'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// 简化的额度管理
const ANONYMOUS_LIMIT = 3;

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [remainingCredits, setRemainingCredits] = useState(ANONYMOUS_LIMIT);
  const [mounted, setMounted] = useState(false);

  // 安全的 localStorage 访问
  const getStorageItem = useCallback((key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, []);

  const setStorageItem = useCallback((key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }, []);

  // 客户端初始化
  useEffect(() => {
    setMounted(true);
    const saved = getStorageItem('anonymousCreditsUsed');
    const used = saved ? parseInt(saved, 10) || 0 : 0;
    setRemainingCredits(Math.max(0, ANONYMOUS_LIMIT - used));
  }, [getStorageItem]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (remainingCredits <= 0) {
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
      const result = event.target?.result;
      if (typeof result === 'string') {
        setOriginalImage(result);
      }
    };
    reader.onerror = () => {
      setError('读取图片失败，请重试');
    };
    reader.readAsDataURL(file);

    // 处理图片
    processImage(file);
  }, [remainingCredits]);

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('服务器返回格式错误');
      }

      if (!response.ok) {
        throw new Error(data?.error || `处理失败 (${response.status})`);
      }

      if (!data.image) {
        throw new Error('处理结果为空');
      }

      setProcessedImage(data.image);
      
      // 扣减额度
      const anonymousUsed = parseInt(getStorageItem('anonymousCreditsUsed') || '0') || 0;
      setStorageItem('anonymousCreditsUsed', String(anonymousUsed + 1));
      setRemainingCredits(Math.max(0, ANONYMOUS_LIMIT - anonymousUsed - 1));
    } catch (err) {
      const message = err instanceof Error ? err.message : '处理失败，请重试';
      setError(message);
      console.error('Process error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [getStorageItem, setStorageItem]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const mockEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(mockEvent);
    }
  }, [handleFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDownload = useCallback(() => {
    if (!processedImage || typeof window === 'undefined') return;
    try {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `removed-bg-${fileName || 'image'}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } catch (err) {
      console.error('Download error:', err);
      setError('下载失败，请右键保存图片');
    }
  }, [processedImage, fileName]);

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setFileName('');
  }, []);

  const handleUploadClick = useCallback(() => {
    if (remainingCredits === 0) {
      if (typeof window !== 'undefined') {
        window.location.href = '/pricing';
      }
    } else {
      const input = document.getElementById('file-input');
      if (input) {
        input.click();
      }
    }
  }, [remainingCredits]);

  // 未挂载时显示加载状态
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </main>
    );
  }

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
                <span className="font-semibold text-indigo-600">访客</span>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-md text-sm">
                <span className="text-gray-600">剩余额度：</span>
                <span className={`font-semibold ${remainingCredits === 0 ? 'text-red-500' : 'text-indigo-600'}`}>
                  {remainingCredits} 张
                </span>
              </div>
            </div>

            {/* Upgrade Button */}
            <Link 
              href="/pricing"
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
            >
              升级套餐
            </Link>
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
            onDragOver={handleDragOver}
            className={`
              border-4 border-dashed rounded-3xl p-16 text-center bg-white shadow-lg transition-colors cursor-pointer
              ${remainingCredits === 0 
                ? 'border-red-300 hover:border-red-500' 
                : 'border-indigo-300 hover:border-indigo-500'
              }
            `}
            onClick={handleUploadClick}
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
              accept="image/jpeg,image/png,image/jpg,image/webp"
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                onClick={handleReset}
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
