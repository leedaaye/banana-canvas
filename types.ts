
export enum ModelType {
  NANO_BANANA = 'nano_banana_placeholder', // Replaced with dynamic strings in service
  NANO_BANANA_PRO = 'nano_banana_pro_placeholder',
}

export enum AspectRatio {
  DEFAULT = '',
  SQUARE = '1:1',
  PORTRAIT_3_4 = '3:4',
  LANDSCAPE_4_3 = '4:3',
  PORTRAIT_9_16 = '9:16',
  LANDSCAPE_16_9 = '16:9',
}

export enum Resolution {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K',
}

export interface GenerationSettings {
  apiKey: string;
  baseUrl: string;
  modelNanoId: string;
  modelProId: string;
}

export interface GenerationParams {
  prompt: string;
  model: string; // Changed from Enum to string to support custom IDs
  aspectRatio: AspectRatio;
  resolution: Resolution;
  referenceImage?: string; // Base64
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  params: GenerationParams;
  imageUrl: string; // Base64 data URL
}

export interface StorageError {
  name: string;
  message: string;
}
