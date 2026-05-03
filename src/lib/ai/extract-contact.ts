import { getGeminiClient } from "./client";
import {
  CONTACT_EXTRACTION_SYSTEM_PROMPT,
  buildExtractionPrompt,
} from "./prompts";
import type { ContactInfo } from "@/types/result";

export async function extractContactInfo(
  pageText: string
): Promise<ContactInfo> {
  const fallback: ContactInfo = {
    phoneNumber: null,
    presidentName: null,
    companyName: null,
  };

  if (!pageText.trim()) return fallback;

  const client = getGeminiClient();
  if (!client) {
    return extractWithRegex(pageText);
  }

  try {
    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: CONTACT_EXTRACTION_SYSTEM_PROMPT,
    });

    const result = await model.generateContent(buildExtractionPrompt(pageText));
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return extractWithRegex(pageText);

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      phoneNumber: parsed.phoneNumber || null,
      presidentName: parsed.presidentName || null,
      companyName: parsed.companyName || null,
    };
  } catch (error) {
    console.error("AI extraction error:", error);
    return extractWithRegex(pageText);
  }
}

function extractWithRegex(text: string): ContactInfo {
  const phoneMatch = text.match(
    /(?:TEL|Tel|tel|電話|☎|📞)[：:\s]*([0-9０-９]{2,4}[-ー－][0-9０-９]{2,4}[-ー－][0-9０-９]{3,4})/
  );

  let phoneNumber: string | null = null;
  if (phoneMatch) {
    phoneNumber = phoneMatch[1]
      .replace(/[０-９]/g, (c) =>
        String.fromCharCode(c.charCodeAt(0) - 0xfee0)
      )
      .replace(/[ー－]/g, "-");
  }

  return {
    phoneNumber,
    presidentName: null,
    companyName: null,
  };
}
