
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
    },
    {
      id: "math-3", timestamp: Date.now(), mode: "COACH",
      stepByStepLogic: { steps: ["Circle diameter = 10", "A = πr^2", "A = π(10)^2", "A = 100π"], incorrectStepIndex: 2, criticalDeviationType: "Interpretation" },
      errorBoundingBox: { box_2d: [300, 200, 500, 800], label: "Diameter Trap" },
      correctSolution: "A = π(5)^2 = 25π", finalAnswer: "25π",
      thinkingReplay: { header: "Premature Execution", moments: ["You saw the number 10 and plugged it in immediately.", "The 'Sensei' recommends identifying D vs R first."] },
      shortcutMethod: "Divide by 2 as soon as you see the word 'Diameter'.",
      youtubeUrl: "https://www.youtube.com/watch?v=O-cawByg2aA",
      modeSummaryFooter: "Read twice, compute once."
    },
    {
      id: "math-4", timestamp: Date.now(), mode: "COGNITIVE",
      stepByStepLogic: { steps: ["log2(x) + log2(x-2) = 3", "log2(x + x - 2) = 3", "2x - 2 = 2^3", "2x = 10, x = 5"], incorrectStepIndex: 1, criticalDeviationType: "Property Misuse" },
      errorBoundingBox: { box_2d: [150, 400, 350, 800], label: "Log Addition Error" },
      correctSolution: "log2(x(x-2)) = 3 => x^2 - 2x = 8", finalAnswer: "x = 4",
      thinkingReplay: { header: "Linear Projection Error", moments: ["You treated logs like linear operators where log(A+B) = logA + logB.", "The brain prefers addition over multiplication under pressure."] },
      shortcutMethod: "Logs turn Multiplication into Addition. Don't flip it!",
      youtubeUrl: "https://www.youtube.com/watch?v=mQTWzLd_YPY",
      modeSummaryFooter: "Logarithmic properties are fundamental."
    },
    {
      id: "math-5", timestamp: Date.now(), mode: "EXAM",
      stepByStepLogic: { steps: ["Solve for x: sin(x) = 0.5", "x = arcsin(0.5)", "x = 30", "Answer: 30"], incorrectStepIndex: 3, criticalDeviationType: "Incomplete Solution" },
      errorBoundingBox: { box_2d: [700, 300, 850, 600], label: "Domain Missing" },
      correctSolution: "x = 30 + 360n or 150 + 360n", finalAnswer: "Multiple values",
      thinkingReplay: { header: "Symmetry Blindness", moments: ["You found the principal value but ignored the unit circle symmetry.", "Exam boards always check for the second quadrant or general solutions."] },
      shortcutMethod: "Always draw a circle. There are usually two answers.",
      youtubeUrl: "https://www.youtube.com/watch?v=5cTsh8629I8",
      modeSummaryFooter: "Trig requires domain awareness."
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
    },
    {
      id: "phys-2", timestamp: Date.now(), mode: "COACH",
      stepByStepLogic: { steps: ["Mass=2kg, Force=10N", "F = ma", "10 = 2 * a", "a = 5 m/s^2", "Include friction? Yes, µ=0.5", "F_net = 10 + (0.5 * 2 * 9.8)"], incorrectStepIndex: 5, criticalDeviationType: "Directional" },
      errorBoundingBox: { box_2d: [600, 300, 800, 700], label: "Friction Direction" },
      correctSolution: "F_net = 10 - (0.5 * 2 * 9.8)", finalAnswer: "0.1 m/s^2",
      thinkingReplay: { header: "Intuition Conflict", moments: ["You added friction to the pulling force.", "Friction always opposes the direction of intended motion."] },
      shortcutMethod: "Draw a Free Body Diagram. Friction is the 'Stubborn' force.",
      youtubeUrl: "https://www.youtube.com/watch?v=9_C8D9o1TfU",
      modeSummaryFooter: "Dynamics depends on Net Force."
    },
    {
      id: "phys-3", timestamp: Date.now(), mode: "EXAM",
      stepByStepLogic: { steps: ["Parallel circuit: R1=10, R2=10", "R_total = R1 + R2", "R_total = 20 ohms"], incorrectStepIndex: 1, criticalDeviationType: "Conceptual" },
      errorBoundingBox: { box_2d: [200, 400, 400, 800], label: "Parallel Formula" },
      correctSolution: "1/Rt = 1/R1 + 1/R2", finalAnswer: "5 ohms",
      thinkingReplay: { header: "Pattern Confusion", moments: ["You applied the Series formula to a Parallel configuration.", "Occurs when student treats all circuit connections as additive."] },
      shortcutMethod: "Parallel = More paths = Less resistance.",
      youtubeUrl: "https://www.youtube.com/watch?v=fP_OLeB9W_4",
      modeSummaryFooter: "Circuit logic mastery."
    },
    {
      id: "phys-4", timestamp: Date.now(), mode: "COGNITIVE",
      stepByStepLogic: { steps: ["Concave Mirror, u=10cm, f=20cm", "1/v + 1/u = 1/f", "1/v + 1/10 = 1/20", "1/v = 1/20 - 1/10 = -1/20", "Real Image"], incorrectStepIndex: 4, criticalDeviationType: "Interpretation" },
      errorBoundingBox: { box_2d: [600, 150, 800, 450], label: "Image Nature" },
      correctSolution: "Virtual, Erect, Enlarged Image", finalAnswer: "Virtual Image",
      thinkingReplay: { header: "Negative Distance Bias", moments: ["You calculated correctly but misinterpreted the sign.", "Negative 'v' in mirror formula means Virtual (behind the mirror)."] },
      shortcutMethod: "If object is inside focus (u < f), it's a makeup mirror (Virtual).",
      youtubeUrl: "https://www.youtube.com/watch?v=7zv-4Zh-9R4",
      modeSummaryFooter: "Optics sign conventions matter."
    },
    {
      id: "phys-5", timestamp: Date.now(), mode: "COACH",
      stepByStepLogic: { steps: ["P1V1 = P2V2", "Pressure doubles", "Volume must double"], incorrectStepIndex: 2, criticalDeviationType: "Proportionality" },
      errorBoundingBox: { box_2d: [400, 300, 600, 700], label: "Inversely Proportional" },
      correctSolution: "Volume must halve", finalAnswer: "V2 = 0.5 * V1",
      thinkingReplay: { header: "Direct Bias", moments: ["The brain assumes more X means more Y.", "Boyle's Law is inverse: Squeeze it, it gets smaller."] },
      shortcutMethod: "PV = Constant. If one goes Up, the other goes Down.",
      youtubeUrl: "https://www.youtube.com/watch?v=eR49g3ubTBg",
      modeSummaryFooter: "Ideal Gas Law understanding."
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
    },
    {
      id: "prog-2", timestamp: Date.now(), mode: "COACH",
      stepByStepLogic: { steps: ["def add_to_list(val, my_list=[]):", "  my_list.append(val)", "  return my_list", "add_to_list(1) # [1]", "add_to_list(2) # [2]"], incorrectStepIndex: 4, criticalDeviationType: "Mutable Defaults" },
      errorBoundingBox: { box_2d: [100, 100, 300, 900], label: "Default Arg Trap" },
      correctSolution: "my_list should be None by default", finalAnswer: "[1, 2]",
      thinkingReplay: { header: "Scope Persistence", moments: ["You assumed the list resets every call.", "In Python, default arguments are evaluated only once at definition."] },
      shortcutMethod: "Never use [] as a default. Use None.",
      youtubeUrl: "https://www.youtube.com/watch?v=_JGmemuIN8o",
      modeSummaryFooter: "Pythonic edge cases."
    },
    {
      id: "prog-3", timestamp: Date.now(), mode: "EXAM",
      stepByStepLogic: { steps: ["if (x = 5) { ... }"], incorrectStepIndex: 0, criticalDeviationType: "Syntax/Logic" },
      errorBoundingBox: { box_2d: [450, 400, 550, 600], label: "Assignment vs Equality" },
      correctSolution: "if (x == 5)", finalAnswer: "Conditional fix",
      thinkingReplay: { header: "Symbolic Dissonance", moments: ["Confusing the command 'make this' (=) with the question 'is this' (==).", "Classic error that evaluates to true if assignment succeeds."] },
      shortcutMethod: "Yoda conditions: if (5 == x). Then 5 = x throws an error.",
      youtubeUrl: "https://www.youtube.com/watch?v=0_fN_65oI-c",
      modeSummaryFooter: "C-style languages rigor."
    },
    {
      id: "prog-4", timestamp: Date.now(), mode: "COGNITIVE",
      stepByStepLogic: { steps: ["while (i < 10):", "  print(i)", "  # forgot i += 1"], incorrectStepIndex: 2, criticalDeviationType: "Infinite Loop" },
      errorBoundingBox: { box_2d: [700, 200, 900, 500], label: "Missing Increment" },
      correctSolution: "Add i += 1", finalAnswer: "Loop termination",
      thinkingReplay: { header: "State Management Lapse", moments: ["You focused on the action (print) and forgot the context (change).", "The 'Sensei' sees a brain that assumes progress happens automatically."] },
      shortcutMethod: "Every loop needs a 'Break' or a 'Step'. Check for it first.",
      youtubeUrl: "https://www.youtube.com/watch?v=R9Kbe7OALXw",
      modeSummaryFooter: "Control flow discipline."
    },
    {
      id: "prog-5", timestamp: Date.now(), mode: "COACH",
      stepByStepLogic: { steps: ["console.log('A')", "setTimeout(() => console.log('B'), 0)", "console.log('C')", "Result: A, B, C"], incorrectStepIndex: 3, criticalDeviationType: "Event Loop" },
      errorBoundingBox: { box_2d: [500, 100, 800, 900], label: "Async Timing" },
      correctSolution: "Result: A, C, B", finalAnswer: "A, C, B",
      thinkingReplay: { header: "Sequential Fallacy", moments: ["You assumed 0ms means 'Now'.", "Even 0ms goes to the Task Queue, waiting for the Call Stack to clear."] },
      shortcutMethod: "Async is always 'Later', even if 'Later' is in 0ms.",
      youtubeUrl: "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
      modeSummaryFooter: "JavaScript concurrency model."
    }
  ]
};

export async function analyzeReasoning(userInput: string, fileData?: { data: string, mimeType: string }, mode: ReasoningMode = 'EXAM'): Promise<SenseiAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
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
        thinkingConfig: { thinkingBudget: 15000 } 
      }
    });
    return JSON.parse(response.text) as SenseiAnalysis;
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
    strengths: history.length > 2 ? ["Persistent", "Multimodal"] : ["Curious"],
    growthAdvice: history.length > 0 ? "Pay closer attention to Step 2-3 transitions." : "Start your first session to build your profile."
  };
}
