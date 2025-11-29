
import { GenerationParams, GenerationSettings, AspectRatio, Resolution } from "../types";

/**
 * Helper to strip 'data:image/xyz;base64,' prefix for native API
 */
const extractBase64Data = (dataUrl: string): { mimeType: string; data: string } => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  // Fallback if raw base64 string provided
  return { mimeType: 'image/jpeg', data: dataUrl };
};

/**
 * NATIVE GOOGLE API STRATEGY
 * Required for 4K and Strict Aspect Ratio on Gemini 3 Pro
 */
const generateViaNativeApi = async (
  settings: GenerationSettings,
  params: GenerationParams
): Promise<string> => {
  
  // 1. Construct Native Endpoint from Proxy Base URL
  // We need to strip /chat/completions and /v1 to get to the root for /v1beta
  let baseUrl = settings.baseUrl ? settings.baseUrl.trim() : "https://generativelanguage.googleapis.com";
  
  // Remove trailing slash
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  
  // Remove /chat/completions if present
  if (baseUrl.endsWith('/chat/completions')) {
    baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/chat/completions'));
  }

  // Handle version switching: /v1 -> /v1beta
  if (baseUrl.endsWith('/v1')) {
    baseUrl = baseUrl.slice(0, -3) + '/v1beta';
  } else if (!baseUrl.includes('v1beta')) {
    // If it doesn't have a version, append /v1beta. 
    // Careful not to double append if user gave root.
    baseUrl = `${baseUrl}/v1beta`;
  }

  // Final Endpoint: .../v1beta/models/{model}:generateContent
  const endpoint = `${baseUrl}/models/${params.model}:generateContent?key=${settings.apiKey}`;

  // 2. Prepare Config (Native REST API Structure)
  // IMPORTANT: in REST API, 'config' from SDK maps to 'generationConfig' property.
  const imageConfig: any = {};
  
  // Aspect Ratio
  // Native API expects "16:9", "1:1", "3:4", "4:3", "9:16" strictly.
  if (params.aspectRatio) {
    imageConfig.aspectRatio = params.aspectRatio;
  }

  // Resolution
  // "imageSize" param: "4K" or "2K"
  if (params.resolution === Resolution.RES_4K) {
    imageConfig.imageSize = "4K"; 
  } else if (params.resolution === Resolution.RES_2K) {
    imageConfig.imageSize = "2K"; 
  }

  // 3. Prepare Contents
  // We also append the technical requirements to the text prompt as a strong backup
  // because some proxies might drop the 'imageConfig' if they don't fully support v1beta schema.
  let technicalPromptSuffix = ` --resolution ${params.resolution}`;
  if (params.aspectRatio) {
    technicalPromptSuffix += ` --aspect_ratio ${params.aspectRatio}`;
  }
  
  const parts: any[] = [
    { text: params.prompt + technicalPromptSuffix }
  ];

  if (params.referenceImage) {
    const { mimeType, data } = extractBase64Data(params.referenceImage);
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: data
      }
    });
  }

  const payload = {
    contents: [{ parts: parts }],
    generationConfig: {
      imageConfig: imageConfig
    }
  };

  // 4. Send Request
  console.log("Attempting Native Generation:", endpoint, JSON.stringify(payload));
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": settings.apiKey, // Standard Google Header
      "Authorization": `Bearer ${settings.apiKey}` // Proxy Header (New API uses this)
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    // If 404, the proxy might not support native path mapping. Throw specific error to trigger fallback.
    if (response.status === 404) {
      throw new Error("NATIVE_ENDPOINT_NOT_FOUND");
    }
    // If 400, it might be an invalid param (e.g. 4K not supported on this model), let's fallback to OpenAI
    if (response.status === 400) {
      console.warn("Native API 400 Error (likely param mismatch):", text);
      throw new Error("NATIVE_PARAM_ERROR");
    }
    throw new Error(`Native API Error ${response.status}: ${text}`);
  }

  const data = await response.json();
  
  // 5. Parse Native Response
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error("原生 API 未返回候选项 (No candidates)");

  for (const part of candidate.content?.parts || []) {
    // Check for inline image (Raw base64)
    if (part.inlineData && part.inlineData.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
    // Check for text (Sometimes it returns an image URL in text if using a specific tool, though rare for pure generation)
    if (part.text) {
        // Try to find a URL in the text
        const urlMatch = part.text.match(/(https?:\/\/[^\s)]+)/);
        if (urlMatch) return urlMatch[1];
    }
  }

  throw new Error("原生 API 调用成功但未返回图片数据。");
};

/**
 * OPENAI COMPATIBLE STRATEGY (Fallback)
 * Uses standard /v1/chat/completions
 */
const generateViaOpenAI = async (
  settings: GenerationSettings,
  params: GenerationParams
): Promise<string> => {
  // 1. Construct Endpoint URL
  let baseUrl = settings.baseUrl ? settings.baseUrl.trim() : "https://api.openai.com/v1";
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  let endpoint = baseUrl;
  // Handle if user put the full path or just the base
  if (!endpoint.endsWith('/chat/completions')) {
      if (endpoint.endsWith('/v1')) {
         endpoint = `${endpoint}/chat/completions`;
      } else {
         endpoint = `${endpoint}/v1/chat/completions`;
      }
  }

  // 2. Prompt Engineering for Configs (Since we can't send native config objects)
  const dims = getDimensionsDescription(params.aspectRatio, params.resolution);
  const technicalPrompt = `
  STRICT IMAGE GENERATION REQUEST:
  - Generate a REALISTIC, HIGH-QUALITY image based on the user prompt.
  - Aspect Ratio: ${params.aspectRatio || "Default"}
  - Target Resolution: ${params.resolution} (${dims})
  - DO NOT return code. DO NOT return markdown descriptions.
  - RETURN ONLY THE IMAGE URL.
  `;

  // 3. Construct Messages
  const messages: any[] = [
    {
      role: "system",
      content: "You are an AI image generator. You strictly output image URLs."
    },
    {
      role: "user",
      content: [
        { type: "text", text: params.prompt + "\n\n" + technicalPrompt }
      ]
    }
  ];

  if (params.referenceImage) {
    messages[1].content.push({
      type: "image_url",
      image_url: { url: params.referenceImage }
    });
  }

  console.log("Attempting OpenAI-Compat Generation:", endpoint);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: params.model,
      messages: messages,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("API 调用成功但无内容返回。");

  // Extract URL
  const markdownMatch = content.match(/!\[.*?\]\((.*?)\)/);
  if (markdownMatch && markdownMatch[1]) return markdownMatch[1];
  
  const urlMatch = content.match(/(https?:\/\/[^\s)]+)/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];
  
  if (content.startsWith('http')) return content.split(/\s+/)[0];

  throw new Error("无法从响应中解析图片地址。");
};


// Helper for Prompt Engineering Dimensions (Used in Fallback)
const getDimensionsDescription = (aspectRatio: AspectRatio, resolution: Resolution): string => {
  if (resolution === Resolution.RES_4K) return "3840x2160 (4K)";
  if (resolution === Resolution.RES_2K) return "2048x2048 (2K)";
  return "1024x1024 (1K)";
};


/**
 * MAIN GENERATION FUNCTION
 */
export const generateImage = async (
  settings: GenerationSettings,
  params: GenerationParams
): Promise<string> => {
  if (!settings.apiKey) throw new Error("请先配置 API Key。");

  // Attempt 1: Native API (Priority for High Res)
  try {
    return await generateViaNativeApi(settings, params);
  } catch (e: any) {
    console.warn("Native API failed, falling back to OpenAI format.", e);
    // If it was a permission/key error, don't retry, just fail.
    if (e.message.includes("401") || e.message.includes("403")) {
      throw e;
    }
    // Continue to fallback
  }

  // Attempt 2: OpenAI Compatible API
  try {
    return await generateViaOpenAI(settings, params);
  } catch (e: any) {
    throw new Error(`OpenAI 兼容模式尝试失败: ${e.message}`);
  }
};
