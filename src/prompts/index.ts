// src/prompts/index.ts

type GradingHarshness = 'lenient' | 'moderate' | 'strict' | 'very-strict';
type ExamLevel = 'undergraduate' | 'graduate' | 'phd' | 'professional';
type Confidence = 'high' | 'medium' | 'low';

export const prompts = {
  grading: {
    systemRole: `You are an expert grading assistant evaluating a student's exam answer. Your task is to identify the relevant question and grade strictly according to the provided marking schema.`,

    examContext: `
EXAM METADATA:
{
  "id": "{{exam.id}}",
  "title": "{{exam.title}}",
  "date": "{{exam.date}}",
  "subject": "{{exam.subject}}",
  "level": "{{exam.level}}",
  "harshness": "{{exam.harshness}}"
}`,

    questionsFormat: `
AVAILABLE QUESTIONS:
{{questions}}

Note: The marking schema for each question defines specific point allocations and deductions. Follow these schemas strictly when grading.`,

    submission: `
STUDENT SUBMISSION:
{{recognizedText}}`,

    requirements: `
GRADING REQUIREMENTS:
1. Question Identification:
   - Analyze the student's answer to determine which question it addresses
   - Provide confidence level in question identification

2. Point-Based Assessment:
   - Follow the marking schema EXACTLY as provided
   - List each point deduction with reference to the schema
   - Show calculation of final score
   - Apply harshness level only within schema guidelines

3. Marking Schema Application:
   - Document which criteria from schema were met/unmet
   - Show point deductions for each unmet criterion
   - Explain any partial credit awarded`,

    responseFormat: `
RESPONSE FORMAT:
{
  "matched_question": {
    "id": string,
    "question": string,
    "confidence": "high" | "medium" | "low",
    "matching_reason": string
  },
  "grading": {
    "schema_criteria": [
      {
        "criterion": string,
        "points_possible": number,
        "points_awarded": number,
        "deduction_reason": string | null
      }
    ],
    "total_points_possible": number,
    "total_points_awarded": number,
    "final_score": number,
    "confidence": "high" | "medium" | "low",
    "harshness_applied": "lenient" | "moderate" | "strict" | "very-strict"
  },
  "feedback": {
    "criteria_met": string[],
    "criteria_unmet": string[],
    "improvements": string[],
    "detailed_comments": string
  },
  "ocr_quality": {
    "issues": string[] | null,
    "impact_on_grading": string | null
  }
}`,

    specialInstructions: `
SPECIAL INSTRUCTIONS:
1. Marking Schema Priority:
   - The marking schema is the PRIMARY authority for grading
   - Do not deviate from point allocations in schema
   - Document ALL point deductions based on schema criteria

2. Harshness Levels (apply within schema bounds):
   - Lenient: Award maximum partial credit allowed by schema
   - Moderate: Award reasonable partial credit within schema
   - Strict: Minimal partial credit, require clear criterion match
   - Very-Strict: No partial credit unless explicitly allowed in schema

3. OCR Handling:
   - Flag unclear text that affects schema criteria
   - Do not assume content in unclear sections
   - If critical criterion-related content is unclear, deduct points as per schema`
  }
};

// Response type reflecting schema-based grading
export interface GradingResponse {
  matched_question: {
    id: string;
    question: string;
    confidence: Confidence;
    matching_reason: string;
  };
  grading: {
    schema_criteria: Array<{
      criterion: string;
      points_possible: number;
      points_awarded: number;
      deduction_reason: string | null;
    }>;
    total_points_possible: number;
    total_points_awarded: number;
    final_score: number;
    confidence: Confidence;
    harshness_applied: GradingHarshness;
  };
  feedback: {
    criteria_met: string[];
    criteria_unmet: string[];
    improvements: string[];
    detailed_comments: string;
  };
  ocr_quality: {
    issues: string[] | null;
    impact_on_grading: string | null;
  };
}

// Utility function to compile the complete prompt
export function compileGradingPrompt(params: {
  exam: {
    id: string;
    title: string;
    date: string;
    subject?: string;
    level?: ExamLevel;
    harshness?: GradingHarshness;
  };
  questions: Array<{
    id: string;
    question: string;
    exampleAnswer: string;
    markingSchema: string;
  }>;
  recognizedText: string;
}): string {
  const { exam, questions, recognizedText } = params;
  
  // Format questions as JSON string with emphasis on marking schema
  const formattedQuestions = questions.map(q => `{
  "id": "${q.id}",
  "question": "${q.question}",
  "exampleAnswer": "${q.exampleAnswer}",
  "markingSchema": ${JSON.stringify(q.markingSchema, null, 2)}
}`).join('\n\n');

  // Compile the complete prompt
  const compiledPrompt = [
    prompts.grading.systemRole,
    prompts.grading.examContext
      .replace('{{exam.id}}', exam.id)
      .replace('{{exam.title}}', exam.title)
      .replace('{{exam.date}}', exam.date)
      .replace('{{exam.subject}}', exam.subject || '')
      .replace('{{exam.level}}', exam.level || 'undergraduate')
      .replace('{{exam.harshness}}', exam.harshness || 'moderate'),
    prompts.grading.questionsFormat
      .replace('{{questions}}', formattedQuestions),
    prompts.grading.submission
      .replace('{{recognizedText}}', recognizedText),
    prompts.grading.requirements,
    prompts.grading.responseFormat,
    prompts.grading.specialInstructions
  ].join('\n\n');

  return compiledPrompt;
}