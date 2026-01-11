import { GoogleGenAI, Type } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface VerificationResult {
  faceDetected: boolean;
  message: string;
}

export const verifyCheckInImage = async (base64Image: string, employeeName: string): Promise<VerificationResult> => {
  try {
    // Clean the base64 string if it has the prefix
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    // Use gemini-3-flash-preview for Multimodal (Vision) tasks with JSON schema support
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          {
            text: `Analyze this image for an employee time clock system. The employee claims to be "${employeeName}".
            1. Determine if there is a clear human face visible in the photo.
            2. Write a short, friendly, professional greeting for this person (in Portuguese). If no face is detected, warn them politely.
            Return JSON.`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faceDetected: { type: Type.BOOLEAN },
            message: { type: Type.STRING }
          },
          required: ['faceDetected', 'message']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(text) as VerificationResult;
    return result;

  } catch (error) {
    console.error("Gemini Verification Error:", error);
    // Fallback in case of API error, allow the punch but warn
    return {
      faceDetected: true, // Assume true to not block flow on API fail
      message: `Olá ${employeeName}, ponto registrado (Verificação Offline).`
    };
  }
};