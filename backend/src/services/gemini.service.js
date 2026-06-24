/**
 * @file gemini.service.js
 * @description Google AI Studio Gemini API Service.
 * Implements visual image analysis, severity generation, resolution agent advice, and community risk predictions.
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

// Check if Gemini API key is configured
if (!apiKey) {
  console.warn("[ResolveAI:Gemini] GEMINI_API_KEY environment variable is not defined. Falling back to mock AI analysis.");
}

// Initialize the Google Gen AI client if API key is present
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Helper to convert file buffer to Gemini inline part
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 */
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

export const geminiService = {
  /**
   * analyzeImage
   * Performs multimodal analysis on an issue photo to categorize it, score severity, and outline suggested resolutions.
   * 
   * @param {Buffer} buffer - File buffer.
   * @param {string} mimeType - Media mime-type (e.g., image/jpeg).
   * @returns {Promise<Object>} Formatted AI insights.
   */
  async analyzeImage(buffer, mimeType) {
    if (!ai) {
      return this.getMockImageAnalysis();
    }

    try {
      const model = "gemini-2.5-flash";
      const imagePart = fileToGenerativePart(buffer, mimeType);
      
      const prompt = `
        You are a civic issue analyzer. Analyze the attached photo of a municipal issue and provide a structured JSON response.
        Return ONLY valid JSON without markdown formatting blocks (do not wrap in \`\`\`json).
        
        The response MUST follow this exact schema:
        {
          "category": "pothole | garbage | water_leakage | broken_streetlight | road_damage | public_infrastructure_damage | other",
          "severity": <number 0-100 representing safety/infrastructure threat severity level>,
          "confidence": <number 0-100 indicating classification confidence>,
          "summary": "<a 3-4 sentence concise summary of the issue visual state>",
          "impact": "<a description of the community risk and daily safety impact>",
          "suggested_resolution": "<concrete engineering or maintenance step to fix this issue>"
        }
        
        Guidelines:
        - Critical categories must score high severity (e.g. open manholes, active road damage, broken streetlights).
        - Categories must be mapped exactly to one of the listed choices.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [prompt, imagePart],
      });

      const responseText = response.text || "";
      // Clean potential JSON wraps
      const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[Gemini Service] Image analysis failed, using mock data:", error);
      return this.getMockImageAnalysis();
    }
  },

  /**
   * generateResolutionAgent
   * Provides detailed operational directives, recommended authority departments, actions, and urgency rankings.
   * 
   * @param {string} title - Issue title.
   * @param {string} description - Detailed description.
   * @param {string} category - Issue category type.
   * @param {number} severity - Calculated severity score.
   * @returns {Promise<Object>} Operational resolution plan.
   */
  async generateResolutionAgent(title, description, category, severity) {
    if (!ai) {
      return this.getMockResolutionAgent(category, severity);
    }

    try {
      const model = "gemini-2.5-flash";
      const prompt = `
        Based on the following civic issue:
        Title: "${title}"
        Description: "${description}"
        Category: "${category}"
        Severity: ${severity}/100

        Act as a municipal management expert and generate a structured JSON report mapping exactly to this schema:
        {
          "recommended_authority": "<exact name of department responsible, e.g. Road Maintenance Department, Sanitation Department, Water Works, Street Lighting Agency, or Public Works>",
          "recommended_action": "<exact technical steps to fix this issue>",
          "estimated_urgency": "Low | Medium | High | Critical",
          "mitigation_suggestions": "<precautionary actions residents should take until fixed>"
        }

        Return ONLY valid JSON without markdown wrapping.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[Gemini Service] Resolution generation failed, using mock:", error);
      return this.getMockResolutionAgent(category, severity);
    }
  },

  /**
   * predictRiskAndMitigation
   * Predicts potential structural risks and future escalation probabilities.
   * 
   * @param {Object} issue - Issue details.
   */
  async predictRiskAndMitigation(issue) {
    if (!ai) {
      return {
        escalationProbability: issue.priority > 60 ? "High" : "Medium",
        structuralRisk: "Moderate concern of local flooding or asphalt collapse.",
      };
    }
    try {
      const model = "gemini-2.5-flash";
      const prompt = `
        Analyze this reported issue: ${JSON.stringify(issue)}.
        Determine safety escalation hazards and return a JSON structure:
        {
          "escalationProbability": "Low | Medium | High",
          "structuralRisk": "<short description of risks>"
        }
        Return ONLY valid JSON.
      `;
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      const cleaned = response.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        escalationProbability: "Medium",
        structuralRisk: "Precautionary hazard checks advised.",
      };
    }
  },

  /**
   * getMockImageAnalysis
   */
  getMockImageAnalysis() {
    return {
      category: "pothole",
      severity: 65,
      confidence: 90.0,
      summary: "A large, deep pothole is visible in the middle of a two-lane asphalt roadway, exposing granular sub-base layers.",
      impact: "Vehicular damage risk is high; drivers are seen swerving to avoid it, creating collision hazards for oncoming traffic.",
      suggested_resolution: "Execute asphalt patch milling, apply bonding aggregate seal, fill with standard hot mix asphalt, and compact."
    };
  },

  /**
   * getMockResolutionAgent
   */
  getMockResolutionAgent(category, severity) {
    let authority = "Public Works Department";
    let urgency = "Medium";
    if (category === "pothole" || category === "road_damage") {
      authority = "Road Infrastructure Maintenance";
      urgency = severity > 70 ? "High" : "Medium";
    } else if (category === "garbage") {
      authority = "Sanitation & Waste Management";
      urgency = "Medium";
    } else if (category === "water_leakage") {
      authority = "Municipal Water Supply Agency";
      urgency = severity > 80 ? "Critical" : "High";
    } else if (category === "broken_streetlight") {
      authority = "Municipal Electrical Services";
      urgency = "Medium";
    }

    return {
      recommended_authority: authority,
      recommended_action: `Deploy local repair unit to assess ${category} scale, apply barricades, and schedule fix within 48 hours.`,
      estimated_urgency: urgency,
      mitigation_suggestions: "Advise vehicles and pedestrians to proceed with caution and slow down when traversing the area."
    };
  }
};
