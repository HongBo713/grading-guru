// src/services/aiService.ts
import OpenAI from 'openai';
import type { Question, Exam, GradingResult } from '../types/exam';

export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'onnx';
  apiKey: string;
  model: string;
}

interface GradingRequest {
  exam: Exam;
  questions: Question[];
  imageData: string;
}

// OpenAI Service Implementation
class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor(config: AIServiceConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true
    });
    this.model = config.model;
  }

  private createStructuredPrompt(exam: Exam, questions: Question[]): string {
    const harshnessFactor = exam.harshness || 'moderate';
    const examLevel = exam.level || 'undergraduate';
    
    return `You are grading a ${examLevel}-level ${exam.subject} exam with ${harshnessFactor} grading standards.

Exam Details:
Title: ${exam.title}
Subject: ${exam.subject}
Level: ${examLevel}
Grading Harshness: ${harshnessFactor}

Questions and Criteria:
${questions.map((q, idx) => `
Question ${idx + 1}:
${q.question}

Example Answer:
${q.exampleAnswer}

Marking Schema:
${q.markingSchema}
`).join('\n')}

Please analyze the student's answer and provide a complete evaluation in the following JSON format:

{
  "matched_question": {
    "question": "the matched question text",
    "confidence": 0.95
  },
  "grading": {
    "final_score": 8,
    "total_points_possible": 10,
    "confidence": 0.9,
    "schema_criteria": [
      {
        "criterion": "Understanding of core concepts",
        "points_awarded": 4,
        "points_possible": 5,
        "deduction_reason": "Partial explanation of key concepts"
      }
    ]
  },
  "feedback": {
    "detailed_comments": "Your answer demonstrates good understanding...",
    "criteria_met": [
      "Clear explanation of basic concepts",
      "Good use of examples"
    ],
    "criteria_unmet": [
      "Could provide more detailed analysis",
      "Missing some key comparisons"
    ],
    "improvements": [
      "Consider adding more specific examples",
      "Explain the practical implications in more detail"
    ]
  }
}

Important: Return a single, complete JSON response without any markdown formatting or code blocks.`;
  }

  private convertToNumber(value: string | number | undefined | null): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  private cleanResponse(content: string): string {
    // Remove any markdown formatting
    return content.replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  }

  private processAPIResponse(response: any): GradingResult {
    try {
      return {
        matched_question: {
          question: String(response.matched_question?.question || ''),
          confidence: this.convertToNumber(response.matched_question?.confidence)
        },
        grading: {
          final_score: this.convertToNumber(response.grading?.final_score),
          total_points_possible: this.convertToNumber(response.grading?.total_points_possible),
          confidence: this.convertToNumber(response.grading?.confidence),
          schema_criteria: (response.grading?.schema_criteria || []).map((criterion: any) => ({
            criterion: String(criterion.criterion || ''),
            points_awarded: this.convertToNumber(criterion.points_awarded),
            points_possible: this.convertToNumber(criterion.points_possible),
            deduction_reason: String(criterion.deduction_reason || '')
          }))
        },
        feedback: {
          detailed_comments: String(response.feedback?.detailed_comments || ''),
          criteria_met: (response.feedback?.criteria_met || []).map(String),
          criteria_unmet: (response.feedback?.criteria_unmet || []).map(String),
          improvements: (response.feedback?.improvements || []).map(String)
        }
      };
    } catch (error) {
      console.error('Error processing API response:', error);
      throw new Error('Failed to process grading response');
    }
  }

  async gradeWithImage(request: GradingRequest): Promise<GradingResult> {
    const { exam, questions, imageData } = request;
    
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are an expert grading assistant evaluating student exam answers from images. Return only a single, complete JSON response without any markdown formatting or code blocks."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: this.createStructuredPrompt(exam, questions)
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        response_format: { type: "text" }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response received from AI service');
      }

      const cleanedResponse = this.cleanResponse(content);
      const parsedResponse = JSON.parse(cleanedResponse);
      return this.processAPIResponse(parsedResponse);

    } catch (error) {
      console.error('Grading error:', error);
      throw error;
    }
  }
}

// Anthropic Service Implementation
class AnthropicService {
  private apiKey: string;
  private model: string;

  constructor(config: AIServiceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async gradeWithImage(request: GradingRequest): Promise<GradingResult> {
    throw new Error('Anthropic service not implemented yet');
  }
}

// Gemini Service Implementation
class GeminiService {
  private apiKey: string;
  private model: string;

  constructor(config: AIServiceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async gradeWithImage(request: GradingRequest): Promise<GradingResult> {
    throw new Error('Gemini service not implemented yet');
  }
}

// Factory function to create AI service instances
export function createAIService(config: AIServiceConfig) {
  switch (config.provider) {
    case 'openai':
      return new OpenAIService(config);
    case 'anthropic':
      return new AnthropicService(config);
    case 'gemini':
      return new GeminiService(config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

// Configuration loader
export function loadAIConfig(): AIServiceConfig | null {
  try {
    const savedSettings = localStorage.getItem('aiModelSettings');
    if (!savedSettings) return null;

    const settings = JSON.parse(savedSettings);
    const activeProvider = settings.activeProvider;
    
    if (!activeProvider || !settings[activeProvider]?.enabled) {
      return null;
    }

    return {
      provider: activeProvider,
      apiKey: settings[activeProvider].apiKey,
      model: settings[activeProvider].selectedModel || ''
    };
  } catch (error) {
    console.error('Error loading AI settings:', error);
    return null;
  }
}