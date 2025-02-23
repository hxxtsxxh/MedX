import axios from 'axios';
import { Medication } from './medications';
import { GEMINI_API_KEY } from '@env';

export type InteractionSeverity = 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';

export interface DrugInteraction {
  medications: string[];
  description: string;
  severity: InteractionSeverity;
  recommendation: string;
  dosageImpact?: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Function to analyze drug interactions using Gemini API
export async function analyzeDrugInteractions(medications: Medication[]): Promise<DrugInteraction[]> {
  if (medications.length <= 1) {
    return [];
  }

  try {
    const medicationInfo = medications.map(med => ({
      name: med.brand_name,
      generic: med.generic_name,
      dosage: med.schedule?.dosage || 'unknown dosage',
      frequency: med.schedule?.frequency || 'unknown frequency',
      times: med.schedule?.times || [],
      form: med.dosage_form || 'unknown form'
    }));

    const response = await axios.post<GeminiResponse>(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: generatePrompt(medicationInfo)
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }
    );

    const content = cleanResponse(response.data);
    return parseAndValidateInteractions(content);
  } catch (error) {
    console.error('Error analyzing drug interactions:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error details:', error.response?.data);
    }
    return [];
  }
}

// Helper function to generate the prompt
function generatePrompt(medications: any[]): string {
  return `As a clinical pharmacist with expertise in drug interactions, analyze these medications for ALL potential drug interactions, considering medications, dosages, timing, and administration routes.

Return ONLY a JSON array containing every possible interaction between the medications. Each interaction must follow this exact structure:
{
  "medications": string[],
  "severity": "HIGH" | "MODERATE" | "LOW",
  "description": string,
  "recommendation": string,
  "dosageImpact": string
}

Medications to analyze:
${medications.map(med => `- ${med.name} (${med.generic}): ${med.dosage}, ${med.frequency}, ${med.form}, taken at ${med.times.join(', ')}`).join('\n')}

Consider these critical factors for each interaction:

1. Pharmacokinetic Interactions:
   - Absorption impacts (timing, food interactions, pH changes)
   - Distribution effects (protein binding competition)
   - Metabolism interactions (CYP450 enzyme effects)
   - Excretion modifications (renal/hepatic impacts)

2. Pharmacodynamic Interactions:
   - Additive effects
   - Synergistic effects
   - Antagonistic effects
   - Overlapping side effects

3. Timing-Based Analysis:
   - Medication timing separation needs
   - Peak concentration overlaps
   - Duration of effects
   - Cumulative impacts

4. Administration Considerations:
   - Drug formulation interactions
   - Absorption window conflicts
   - Physical/chemical incompatibilities
   - Optimal spacing recommendations

5. Risk Assessment Criteria:
   HIGH severity:
   - Life-threatening interactions
   - Significant clinical impact
   - Narrow therapeutic window drugs
   - Strong enzyme inhibition/induction

   MODERATE severity:
   - Clinically significant but manageable
   - Requires monitoring or dose adjustment
   - Moderate enzyme effects
   - Therapeutic efficacy impacts

   LOW severity:
   - Minor clinical significance
   - Easily managed interactions
   - Minimal dose adjustments needed
   - Theoretical interactions

For each interaction:
1. Evaluate mechanism of interaction
2. Consider dosage-dependent effects
3. Assess timing impact
4. Analyze administration route conflicts
5. Provide specific monitoring parameters
6. Recommend mitigation strategies

Example response format:
[
  {
    "medications": ["Warfarin 5mg", "Aspirin 81mg"],
    "severity": "HIGH",
    "description": "Combined anticoagulant effect increases bleeding risk. Both medications affect blood clotting through different mechanisms (Warfarin via vitamin K antagonism, Aspirin via platelet inhibition).",
    "recommendation": "Monitor INR closely. Consider alternative antiplatelet if possible. If combination necessary, use lowest effective aspirin dose and monitor for bleeding signs.",
    "dosageImpact": "Current doses create significant risk. Risk increases with higher doses of either medication. Consider aspirin dose reduction if combination necessary."
  }
]

Analyze every possible combination and consider cumulative effects of multiple medications.
If no interactions exist, return [].`;
}

// Helper function to clean the API response
function cleanResponse(response: GeminiResponse): string {
  if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response format from Gemini API');
  }

  return response.candidates[0].content.parts[0].text
    .replace(/```json\n?|\n?```/g, '')
    .replace(/^JSON:?\s*/i, '')
    .trim();
}

// Helper function to parse and validate interactions
function parseAndValidateInteractions(content: string): DrugInteraction[] {
  try {
    const interactions = JSON.parse(content);
    if (!Array.isArray(interactions)) {
      throw new Error('Response is not an array');
    }

    return interactions.filter(interaction => (
      Array.isArray(interaction.medications) &&
      interaction.medications.length >= 2 &&
      ['HIGH', 'MODERATE', 'LOW'].includes(interaction.severity) &&
      typeof interaction.description === 'string' &&
      typeof interaction.recommendation === 'string' &&
      (!interaction.dosageImpact || typeof interaction.dosageImpact === 'string')
    ));
  } catch (error) {
    console.error('Error parsing interactions:', error);
    console.log('Raw content:', content);
    return [];
  }
} 
