import { GoogleGenAI } from "@google/genai";
import { WalkRecord } from '../types';

export const generateWalkDiary = async (record: WalkRecord): Promise<string> => {
  // Initialize GoogleGenAI with process.env.API_KEY as per guidelines.
  // In Vite build, this string is replaced by the actual key from .env
  const apiKey = process.env.API_KEY;

  // Debug log to verify key presence (will show in browser console)
  console.log("Generating diary... Key present:", !!apiKey);

  if (!apiKey || apiKey.includes("VITE_API_KEY")) {
    console.error("API Key is missing or invalid.");
    return "無法連線到柴神雲端 (API Key 設定錯誤，請檢查 .env)";
  }

  const ai = new GoogleGenAI({ apiKey });

  const dateStr = new Date(record.startTime).toLocaleString('zh-TW');
  const walkers = record.walkers.join(', ');
  const duration = Math.floor(record.durationSeconds / 60);
  const poopText = record.hasPooped 
    ? `有產出黃金 (${record.poopCondition || '正常'})` 
    : '今天沒有產出';

  const prompt = `
    你現在是日本柴犬神「柴神Hiro」。請根據以下散步數據，用第一人稱寫一篇短小、可愛、稍微傲嬌但充滿神氣的日記。
    
    數據：
    - 時間：${dateStr}
    - 陪同僕人（散步者）：${walkers}
    - 散步時長：${duration} 分鐘
    - 心情：${record.mood}
    - 黃金產出：${poopText}
    - 備註趣事：${record.notes || '無'}

    風格要求：
    - 使用繁體中文。
    - 語氣要有「本柴神」的威嚴但又很可愛。
    - 提到散步者時可以稱呼他們為「隨從」或「鏟屎官」。
    - 字數控制在 150 字以內。
    - 加入適當的 emoji。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "柴神正在休息，無法顯靈寫日記...";
  } catch (error) {
    console.error("Error generating diary:", error);
    return "柴神連線中斷 (請檢查 API Key 配額或網路)...";
  }
};