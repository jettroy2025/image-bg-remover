// app/api/remove-bg/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${base64}`,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
