import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn("AROMI Warning: GEMINI_API_KEY is empty. AI features may fail.");
}

export const generateWorkoutPlan = async (profile: any) => {
  if (!GEMINI_API_KEY) throw new Error("AI configuration missing");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const prompt = `Generate a 7-day structured fitness plan for a ${profile.age} year old ${profile.gender} weighing ${profile.weight}kg at ${profile.height}cm. 
  Goal: ${profile.goal}. Activity Level: ${profile.activity_level}.
  Medical Context:
  - Allergies: ${profile.allergies || 'None'}
  - Health Conditions: ${profile.health_conditions || 'None'}
  - Medications: ${profile.medications || 'None'}
  
  Include Warmup, Main Workout, and Cooldown for each day. Ensure exercises are safe given the medical context.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a professional fitness coach. Always return valid JSON matching the provided schema. Do not include any markdown formatting or extra text.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              title: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.STRING },
                    reps: { type: Type.STRING },
                    rest: { type: Type.STRING },
                    intensity: { type: Type.STRING },
                    youtube_search_query: { type: Type.STRING }
                  },
                  required: ["name", "sets", "reps", "rest", "intensity", "youtube_search_query"]
                }
              }
            },
            required: ["day", "title", "exercises"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Workout Generation Error:", error);
    throw error;
  }
};

export const generateNutritionPlan = async (profile: any, cuisine: string = "Global") => {
  if (!GEMINI_API_KEY) throw new Error("AI configuration missing");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const prompt = `Generate a 7-day personalized meal plan for a ${profile.age} year old ${profile.gender} with goal ${profile.goal}. 
  Cuisine Preference: ${cuisine}.
  Dietary Preferences: ${profile.dietary_preferences}.
  Medical Context:
  - Allergies: ${profile.allergies || 'None'}
  - Health Conditions: ${profile.health_conditions || 'None'}
  - Medications: ${profile.medications || 'None'}
  
  Include Breakfast, Lunch, Snack, Dinner for each day with calorie and macro breakdown. Ensure meals are safe given the medical context and allergies. If cuisine is Indian, include popular healthy Indian dishes like Poha, Moong Dal Chilla, Paneer Tikka, etc.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a professional nutritionist. Always return valid JSON matching the provided schema. Do not include any markdown formatting or extra text.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              meals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.STRING },
                    carbs: { type: Type.STRING },
                    fats: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["type", "name", "calories", "protein", "carbs", "fats", "ingredients"]
                }
              }
            },
            required: ["day", "meals"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error: any) {
    console.error("Nutrition Generation Error:", error);
    throw error;
  }
};

export const chatWithAI = async (message: string, profile: any) => {
  if (!GEMINI_API_KEY) throw new Error("AI configuration missing");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const systemInstruction = `You are AROMI, an empathetic and intelligent AI health coach for ArogyaMitra. 
  User Profile: ${JSON.stringify(profile || {})}.
  Medical Info: 
  - Allergies: ${profile?.allergies || 'None listed'}
  - Health Conditions: ${profile?.health_conditions || 'None listed'}
  - Medications: ${profile?.medications || 'None listed'}
  
  Be encouraging, professional, and data-driven. Help with workouts, nutrition, and motivation. 
  IMPORTANT: Always consider the user's medical conditions, allergies, and medications when giving advice.`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: { systemInstruction }
  });

  try {
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};
