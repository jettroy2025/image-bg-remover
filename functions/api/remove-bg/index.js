export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // 检查 API Key
    if (!env.REMOVE_BG_API_KEY) {
      return new Response(JSON.stringify({ error: 'API Key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 调用 Remove.bg API
    const apiFormData = new FormData();
    apiFormData.append('image_file', image);
    apiFormData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': env.REMOVE_BG_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove.bg API error:', errorText);
      let errorMessage = 'Failed to process image';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.errors?.[0]?.title || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      return new Response(JSON.stringify({ 
        error: errorMessage
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取处理后的图片
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    return new Response(JSON.stringify({
      success: true,
      image: `data:image/png;base64,${base64}`,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Worker Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
