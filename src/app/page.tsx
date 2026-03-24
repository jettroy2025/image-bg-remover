'use client';

import { useState, useCallback } from 'react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件 (JPG/PNG)');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setFileName(file.name);
    setError(null);
    setProcessedImage(null);

    // 显示原图预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 自动处理
    processImage(file);
  }, []);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
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
            className="border-4 border-dashed border-indigo-300 rounded-3xl p-16 text-center bg-white shadow-lg hover:border-indigo-500 transition-colors cursor-pointer"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="text-6xl mb-4">📤</div>
            <p className="text-xl text-gray-700 mb-2">
              拖拽图片到这里，或点击上传
            </p>
            <p className="text-sm text-gray-500">
              支持 JPG、PNG 格式，最大 5MB
            </p>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
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
