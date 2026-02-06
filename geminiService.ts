
import { GoogleGenAI, Type } from "@google/genai";
import { SenseiAnalysis, ReasoningMode, CognitiveProfile } from "./types";

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mode: { type: Type.STRING },
    stepByStepLogic: {
      type: Type.OBJECT,
      properties: {
        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        incorrectStepIndex: { type: Type.INTEGER },
        criticalDeviationType: { type: Type.STRING, description: "One of: Calculation, Logic, Sign, Premature, Formula, Interpretation." }
      },
      required: ["steps", "incorrectStepIndex", "criticalDeviationType"]
    },
    errorBoundingBox: {
      type: Type.OBJECT,
      properties: {
        box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "[ymin, xmin, ymax, xmax] scaled 0-1000." },
        label: { type: Type.STRING }
      },
      required: ["box_2d", "label"]
    },
    correctSolution: { type: Type.STRING },
    finalAnswer: { type: Type.STRING },
    examTrapAlert: { type: Type.STRING },
    thinkingReplay: {
      type: Type.OBJECT,
      properties: {
        header: { type: Type.STRING },
        moments: { type: Type.ARRAY, items: { type: Type.STRING } },
        additionalNote: { type: Type.STRING },
        cognitiveInsight: { type: Type.STRING }
      },
      required: ["header", "moments"]
    },
    shortcutMethod: { type: Type.STRING },
    cognitiveInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
    videoRecommendation: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        explanation: { type: Type.STRING },
        link: { type: Type.STRING }
      }
    },
    modeSummaryFooter: { type: Type.STRING }
  },
  required: ["mode", "stepByStepLogic", "correctSolution", "finalAnswer", "thinkingReplay", "modeSummaryFooter"]
};

export async function generateConceptualVideo(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Educational animation: ${prompt}. High quality, clean background, 3D render style, simplified colors.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function performAnalysisAttempt(
  userInput: string, 
  imageData: string | undefined, 
  mode: ReasoningMode
): Promise<SenseiAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-image-preview";
  
  const history = JSON.parse(localStorage.getItem('sensei_history') || '[]');
  const lastErrors = history.slice(-5).map((h: any) => h.stepByStepLogic.criticalDeviationType).join(", ");
  const historyContext = history.length > 0 ? `USER HISTORY: Recurrent errors: ${lastErrors}.` : "";

  const systemInstruction = `
    YOU ARE GEMINI SENSEI.
    Analyze thinking patterns, not just math. 
    ${historyContext}
    If image: Use bounding box [ymin, xmin, ymax, xmax] (0-1000) for the mistake area.
    End with: “We fix the mind, and the answers follow.”
  `;

  const parts: any[] = [];
  if (imageData) {
    const [header, base64Data] = imageData.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    parts.push({ inlineData: { mimeType, data: base64Data } });
  }
  parts.push({ text: `[MODE: ${mode}] PROBLEM: ${userInput}` });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
      thinkingConfig: { thinkingBudget: 8000 },
      tools: [{ googleSearch: {} }]
    }
  });

  const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((c: any) => ({ title: c.web?.title, uri: c.web?.uri }))
    .filter((s: any) => s.uri);

  const analysis = JSON.parse(response.text) as SenseiAnalysis;
  analysis.id = crypto.randomUUID();
  analysis.timestamp = Date.now();
  analysis.groundingSources = groundingSources;

  localStorage.setItem('sensei_history', JSON.stringify([...history, analysis].slice(-50)));
  return analysis;
}

export async function analyzeReasoning(userInput: string, imageData?: string, mode: ReasoningMode = 'EXAM'): Promise<SenseiAnalysis> {
  try {
    return await performAnalysisAttempt(userInput, imageData, mode);
  } catch (error: any) {
    if (error.message?.includes('429')) throw new Error("QUOTA_EXCEEDED");
    throw error;
  }
}

export function getCognitiveProfile(): CognitiveProfile {
  const history: SenseiAnalysis[] = JSON.parse(localStorage.getItem('sensei_history') || '[]');
  const types: Record<string, number> = {};
  history.forEach(h => {
    const t = h.stepByStepLogic.criticalDeviationType || 'Unknown';
    types[t] = (types[t] || 0) + 1;
  });
  return {
    totalSessions: history.length,
    topErrorTypes: types,
    strengths: history.length > 3 ? ["Grit", "Multimodal learner"] : ["New Journey"],
    growthAdvice: history.length === 0 ? "Begin your first analysis." : "Watch for sign changes in Step 2."
  };
}
