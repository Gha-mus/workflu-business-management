import OpenAI from "openai";
import fs from "fs";
import path from "path";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface WorkflowAnalysis {
  stage: number;
  name: string;
  keyRequirements: string[];
  currentImplementationGaps: string[];
  requiredImplementations: string[];
  validations: string[];
  tests: string[];
  mobileConsiderations: string[];
}

interface ComplianceMatrix {
  stages: WorkflowAnalysis[];
  globalRequirements: string[];
  deliverables: string[];
  priorityOrder: number[];
}

export class WorkflowAnalysisService {
  
  async analyzeWorkflowReference(): Promise<ComplianceMatrix> {
    try {
      // Read the workflow reference file
      const workflowPath = path.join(process.cwd(), 'workflow_reference.json');
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      
      const analysisPrompt = `
        You are a senior software architect analyzing a comprehensive business workflow specification. 
        
        TASK: Analyze the attached workflow_reference.json and create a detailed implementation strategy for a trading/import business management system.
        
        The file contains 10 business stages that must be implemented with EXACT compliance to the specifications.
        
        For each stage (1-10), extract and analyze:
        1. Stage name and core purpose
        2. Key requirements (data structures, validations, workflows)
        3. Integration points with other stages
        4. Required validations and controls
        5. UI/UX requirements including mobile responsiveness
        6. Testing requirements to prove compliance
        
        Global requirements that apply to all stages:
        - Central FX enforcement from Settings (Stage 10)
        - Negative balance prevention toggle
        - Linked entry protection (no deletions)
        - Period closing with admin approval
        - Mobile responsiveness
        - Comprehensive audit logging
        
        Return your analysis in JSON format with this structure:
        {
          "stages": [
            {
              "stage": number,
              "name": string,
              "keyRequirements": string[],
              "currentImplementationGaps": string[],
              "requiredImplementations": string[],
              "validations": string[],
              "tests": string[],
              "mobileConsiderations": string[]
            }
          ],
          "globalRequirements": string[],
          "deliverables": string[],
          "priorityOrder": number[]
        }
        
        Focus on actionable implementation details, not just summaries.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are a senior software architect specializing in business workflow systems and regulatory compliance." },
          { role: "user", content: `${analysisPrompt}\n\nWorkflow Reference:\n${workflowContent}` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return analysis as ComplianceMatrix;
      
    } catch (error) {
      console.error('Failed to analyze workflow reference:', error);
      throw new Error(`Workflow analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async generateImplementationPlan(analysis: ComplianceMatrix): Promise<string> {
    try {
      const planPrompt = `
        Based on the workflow analysis provided, create a detailed technical implementation plan.
        
        Focus on:
        1. Database schema changes needed
        2. API endpoints to create/modify
        3. Frontend components and pages
        4. Business logic and validation services
        5. Migration strategies
        6. Testing approaches
        
        Provide concrete code examples and implementation steps.
        Be specific about file paths, function names, and architectural decisions.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5", 
        messages: [
          { role: "system", content: "You are a senior full-stack developer creating technical implementation plans." },
          { role: "user", content: `${planPrompt}\n\nAnalysis:\n${JSON.stringify(analysis, null, 2)}` }
        ],
        max_completion_tokens: 4000
      });

      return response.choices[0].message.content || '';
      
    } catch (error) {
      console.error('Failed to generate implementation plan:', error);
      throw new Error(`Implementation plan generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}