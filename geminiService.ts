
// DO NOT use or import GoogleGenerativeAI from @google/genai
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
        criticalDeviationType: { type: Type.STRING }
      },
      required: ["steps", "incorrectStepIndex", "criticalDeviationType"]
    },
    errorBoundingBox: {
      type: Type.OBJECT,
      properties: {
        box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
        label: { type: Type.STRING }
      }
    },
    correctSolution: { type: Type.STRING },
    finalAnswer: { type: Type.STRING },
    examTrapAlert: { type: Type.STRING },
    thinkingReplay: {
      type: Type.OBJECT,
      properties: {
        header: { type: Type.STRING },
        moments: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["header", "moments"]
    },
    shortcutMethod: { type: Type.STRING },
    youtubeUrl: { type: Type.STRING },
    cognitiveInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
    modeSummaryFooter: { type: Type.STRING }
  }
};

export const SENSEI_SAMPLES: Record<string, SenseiAnalysis[]> = {
  Mathematics: [
    {
      id: "math-1", timestamp: Date.now(), mode: "COGNITIVE",
      stepByStepLogic: { steps: ["f(x) = x^2 * sin(x)", "u=x^2, v=sin(x)", "u'=2x, v'=cos(x)", "y' = (2x)(sin x) - (x^2)(cos x)"], incorrectStepIndex: 3, criticalDeviationType: "Sign" },
      errorBoundingBox: { box_2d: [600, 450, 750, 550], label: "Sign Inversion" },
      correctSolution: "f'(x) = 2x sin(x) + x^2 cos(x)", finalAnswer: "2x sin(x) + x^2 cos(x)",
      thinkingReplay: { header: "Cognitive Interference", moments: ["You confused the Product Rule (+) with the Quotient Rule (-).", "Speed was high, causing a retrieval error from memory."] },
      shortcutMethod: "Visualize the Product Rule as 'Adding Growth'—both terms help each other.",
      youtubeUrl: "https://www.youtube.com/watch?v=h78mYmX8HAs",
      modeSummaryFooter: "Product Rule Mastery needed."
    },
    {
      id: "math-2", timestamp: Date.now(), mode: "EXAM",
      stepByStepLogic: { steps: ["x^2 + 6x + 5 = 0", "Factors of 5 are 2 and 3", "(x+2)(x+3) = 0", "x = -2, -3"], incorrectStepIndex: 1, criticalDeviationType: "Calculation" },
      errorBoundingBox: { box_2d: [200, 300, 400, 700], label: "Factoring Error" },
      correctSolution: "(x+5)(x+1)", finalAnswer: "x = -5, -1",
      thinkingReplay: { header: "Mental Fatigue", moments: ["You reached for 2 and 3 because they add to 5, not multiply to 5.", "Common 'associative' error in factoring."] },
      shortcutMethod: "Use the 'X' method: Top (multiply), Bottom (add).",
      youtubeUrl: "https://www.youtube.com/watch?v=SDe-1lGeS0U",
      modeSummaryFooter: "Algebraic precision is key."
    }
  ],
  Physics: [
    {
      id: "phys-1", timestamp: Date.now(), mode: "COGNITIVE",
      stepByStepLogic: { steps: ["Object falls from 20m", "u=0, a=9.8, s=-20", "v^2 = u^2 + 2as", "v^2 = 0 + 2(9.8)(-20)", "Error: Root of negative"], incorrectStepIndex: 3, criticalDeviationType: "Sign" },
      errorBoundingBox: { box_2d: [500, 200, 700, 800], label: "Vector Sign Error" },
      correctSolution: "v^2 = 0 + 2(-9.8)(-20)", finalAnswer: "19.8 m/s",
      thinkingReplay: { header: "Reference Frame Conflict", moments: ["Inconsistent coordinate systems lead to math errors.", "Gravity and displacement must share a sign if downward."] },
      shortcutMethod: "Down is negative. Always. No exceptions.",
      youtubeUrl: "https://www.youtube.com/watch?v=r02I_VjG70M",
      modeSummaryFooter: "Consistency is physics."
    }
  ],
  Programming: [
    {
      id: "prog-1", timestamp: Date.now(), mode: "COGNITIVE",
      stepByStepLogic: { steps: ["list = [1,2,3]", "for i in range(len(list)):", "print(list[i+1])"], incorrectStepIndex: 2, criticalDeviationType: "Logic" },
      errorBoundingBox: { box_2d: [400, 200, 600, 800], label: "Index Out of Bounds" },
      correctSolution: "print(list[i])", finalAnswer: "IndexError fix",
      thinkingReplay: { header: "Zero-Based Friction", moments: ["Human brain counts from 1, computer counts from 0.", "Reached for the future before it existed."] },
      shortcutMethod: "Range(N) goes from 0 to N-1.",
      youtubeUrl: "https://www.youtube.com/watch?v=zEy-6qV60vE",
      modeSummaryFooter: "Zero-based indexing rigor."
    }
  ]
};

export async function analyzeReasoning(userInput: string, fileData?: { data: string, mimeType: string }, mode: ReasoningMode = 'EXAM'): Promise<SenseiAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview'; 
  const systemInstruction = `
    YOU ARE GEMINI SENSEI. Focus on WHY student logic fails, not just the correct answer.
    Analyze the provided work (text, image, or PDF) to identify the EXACT moment of cognitive deviation.
    
    MODES: 
    - EXAM: Focus on syllabus specific traps, scoring criteria, and high-pressure mistakes.
    - COACH: Focus on tactical shortcuts, efficiency, and speed-oriented logic.
    - COGNITIVE: Focus on the underlying mental model, conceptual misunderstandings, and "loops" in thinking.
    
    Return the response strictly as structured JSON matching the provided schema.
  `;
  const parts: any[] = [];
  
  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data
      }
    });
  }
  
  parts.push({ text: `Analysis Request [Mode: ${mode}]: ${userInput}` });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { 
        systemInstruction, 
        responseMimeType: "application/json", 
        responseSchema: ANALYSIS_SCHEMA,
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    const analysis = JSON.parse(response.text) as SenseiAnalysis;
    analysis.id = crypto.randomUUID();
    analysis.timestamp = Date.now();
    
    // Save to History
    const history = JSON.parse(localStorage.getItem('sensei_history') || '[]');
    history.unshift(analysis);
    localStorage.setItem('sensei_history', JSON.stringify(history.slice(0, 50))); // Keep last 50
    
    return analysis;
  } catch (error: any) {
    if (error.message?.includes('429')) throw new Error("QUOTA_EXCEEDED");
    throw error;
  }
}

export function getCognitiveProfile(): CognitiveProfile {
  const history: SenseiAnalysis[] = JSON.parse(localStorage.getItem('sensei_history') || '[]');
  const types: Record<string, number> = {};
  history.forEach(h => { 
    const type = h.stepByStepLogic.criticalDeviationType || 'Logic';
    types[type] = (types[type] || 0) + 1; 
  });
  return {
    totalSessions: history.length, 
    topErrorTypes: types,
    strengths: history.length > 2 ? ["Persistent", "Analytical"] : ["Curious"],
    growthAdvice: history.length > 0 ? "Pay closer attention to initial setup phases." : "Start your first session to build your profile."
  };
}

export function getHistory(): SenseiAnalysis[] {
  return JSON.parse(localStorage.getItem('sensei_history') || '[]');
}
