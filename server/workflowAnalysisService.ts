import fs from "fs";
import path from "path";
import { openaiGateway, AIServiceError, AI_ERROR_CODES } from './services/openai/client';
import type OpenAI from "openai";

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

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: "You are a senior software architect specializing in business workflow systems and regulatory compliance." },
        { role: "user", content: `${analysisPrompt}\n\nWorkflow Reference:\n${workflowContent}` }
      ];
      
      const response = await openaiGateway.createChatCompletion(
        messages,
        { 
          feature: 'reports' as const,
          useJson: true
        }
      );

      const analysis = JSON.parse(response || '{}');
      return analysis as ComplianceMatrix;
      
    } catch (error) {
      console.error('Failed to analyze workflow reference:', error);
      if (error instanceof AIServiceError) {
        throw new Error(`AI service unavailable: ${error.message}`);
      }
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

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: "You are a senior full-stack developer creating technical implementation plans." },
        { role: "user", content: `${planPrompt}\n\nAnalysis:\n${JSON.stringify(analysis, null, 2)}` }
      ];
      
      const response = await openaiGateway.createChatCompletion(
        messages,
        { 
          feature: 'reports' as const,
          useJson: false
        }
      );

      return response || '';
      
    } catch (error) {
      console.error('Failed to generate implementation plan:', error);
      if (error instanceof AIServiceError) {
        throw new Error(`AI service unavailable: ${error.message}`);
      }
      throw new Error(`Implementation plan generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}