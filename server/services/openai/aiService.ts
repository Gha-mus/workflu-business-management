import { openaiClient, OPENAI_CONFIG, withRetry, OpenAIError } from './client';
import { config } from '../../config';
import * as prompts from './prompts';
import * as fs from "fs/promises";
import * as path from "path";
import mammoth from "mammoth";
import type {
  Purchase,
  Supplier,
  CapitalEntry,
  WarehouseStock,
  FilterRecord,
  FinancialSummaryResponse,
  InventoryAnalyticsResponse,
  SupplierPerformanceResponse,
  TradingActivityResponse,
} from "@shared/schema";

// Types for workflow validation system
export interface WorkflowSpec {
  stages: {
    [stageName: string]: {
      fields: string[];
      processes: string[];
      roles: string[];
      statuses: string[];
      transitions: Array<{from: string; to: string; conditions: string[]}>;
      validations: string[];
      currencies?: string[];
    };
  };
  overallRequirements: string[];
  complianceRules: string[];
}

export interface SystemSpec {
  tables: {
    [tableName: string]: {
      fields: string[];
      relationships: string[];
      enums: string[];
    };
  };
  endpoints: {
    [endpoint: string]: {
      method: string;
      roles: string[];
      validation: string;
    };
  };
  uiFlows: {
    [pageName: string]: {
      features: string[];
      actions: string[];
    };
  };
  currencies: string[];
  roles: string[];
  statuses: string[];
}

export interface GapReport {
  overallStatus: 'matched' | 'partial' | 'missing';
  stages: {
    [stageName: string]: {
      status: 'matched' | 'partial' | 'missing';
      missingItems: string[];
      extraItems: string[];
      misalignments: string[];
      severity: 'low' | 'medium' | 'high' | 'critical';
      remediation: string[];
    };
  };
  summary: {
    totalGaps: number;
    criticalGaps: number;
    highPriorityGaps: number;
    recommendations: string[];
  };
  generatedAt: string;
}

// OpenAI Configuration Notes:
// 1. Use response_format: { type: "json_object" } for structured responses
// 2. Request output in JSON format in prompts
// 3. Use the configured model from OPENAI_CONFIG

// Use the centralized OpenAI client from config

// AI Service class for WorkFlu business automation
export class WorkFluAIService {
  private static instance: WorkFluAIService;

  public static getInstance(): WorkFluAIService {
    if (!WorkFluAIService.instance) {
      WorkFluAIService.instance = new WorkFluAIService();
    }
    return WorkFluAIService.instance;
  }

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not found. AI features will be disabled.");
    }
  }

  private async createCompletion(messages: OpenAI.Chat.ChatCompletionMessageParam[], useJson = false) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.");
    }

    try {
      const response = await openaiClient.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages,
        // Note: response_format json_object removed due to model compatibility issues
        // Instead, we rely on the system prompt to request JSON format
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`AI service error: ${errorMessage}`);
    }
  }

  // Business Process Automation

  /**
   * Generate AI-powered purchase recommendations based on historical data
   */
  async getPurchaseRecommendations(
    historicalPurchases: Purchase[],
    currentMarketConditions: any,
    availableCapital: number
  ): Promise<{
    recommendations: Array<{
      supplierId: string;
      suggestedQuantity: number;
      suggestedPriceRange: { min: number; max: number };
      reasoning: string;
      confidence: number;
      timing: 'immediate' | 'within_week' | 'within_month';
    }>;
    marketInsights: string;
    riskAssessment: string;
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a trading business AI advisor specializing in coffee/agricultural commodities. 
                  Analyze historical purchase data and provide strategic recommendations for optimizing trading operations.
                  Consider factors like seasonality, supplier performance, market trends, and capital allocation.
                  Respond with JSON in this exact format:
                  {
                    "recommendations": [
                      {
                        "supplierId": "string",
                        "suggestedQuantity": number,
                        "suggestedPriceRange": {"min": number, "max": number},
                        "reasoning": "string",
                        "confidence": number,
                        "timing": "immediate|within_week|within_month"
                      }
                    ],
                    "marketInsights": "string",
                    "riskAssessment": "string"
                  }`
      },
      {
        role: "user",
        content: `Analyze this trading data and provide purchase recommendations:

Historical Purchases (last 6 months):
${JSON.stringify(historicalPurchases.slice(-50), null, 2)}

Current Market Conditions:
${JSON.stringify(currentMarketConditions, null, 2)}

Available Capital: $${availableCapital.toLocaleString()}

Please provide strategic purchase recommendations considering:
1. Seasonal patterns in the data
2. Supplier performance and reliability
3. Price trends and optimal buying opportunities
4. Capital allocation efficiency
5. Risk diversification across suppliers`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  /**
   * Intelligent supplier selection based on performance metrics
   */
  async getSupplierRecommendations(
    suppliers: Supplier[],
    supplierPerformance: SupplierPerformanceResponse,
    currentNeeds: { quantity: number; quality: string; budget: number }
  ): Promise<{
    rankedSuppliers: Array<{
      supplierId: string;
      supplierName: string;
      score: number;
      strengths: string[];
      weaknesses: string[];
      recommendation: string;
    }>;
    insights: string;
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a supplier evaluation expert. Analyze supplier data and rank suppliers based on performance metrics, reliability, and suitability for current business needs.
                  Respond with JSON in this exact format:
                  {
                    "rankedSuppliers": [
                      {
                        "supplierId": "string",
                        "supplierName": "string",
                        "score": number,
                        "strengths": ["string"],
                        "weaknesses": ["string"],
                        "recommendation": "string"
                      }
                    ],
                    "insights": "string"
                  }`
      },
      {
        role: "user",
        content: `Analyze and rank these suppliers for optimal selection:

Available Suppliers:
${JSON.stringify(suppliers, null, 2)}

Supplier Performance Data:
${JSON.stringify(supplierPerformance, null, 2)}

Current Requirements:
- Quantity needed: ${currentNeeds.quantity} kg
- Quality preference: ${currentNeeds.quality}
- Budget: $${currentNeeds.budget.toLocaleString()}

Rank suppliers considering:
1. Historical performance and reliability
2. Price competitiveness
3. Quality consistency
4. Delivery performance
5. Financial stability and relationship strength`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  /**
   * Working capital optimization suggestions
   */
  async getCapitalOptimizationSuggestions(
    capitalEntries: CapitalEntry[],
    financialSummary: FinancialSummaryResponse,
    upcomingPayments: any[]
  ): Promise<{
    optimizations: Array<{
      type: 'cash_flow' | 'capital_allocation' | 'payment_timing' | 'risk_management';
      suggestion: string;
      impact: string;
      priority: 'high' | 'medium' | 'low';
      timeframe: string;
    }>;
    cashFlowForecast: string;
    riskAlerts: string[];
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a financial optimization expert specializing in trading business cash flow management.
                  Analyze working capital data and provide actionable optimization recommendations.
                  Respond with JSON in this exact format:
                  {
                    "optimizations": [
                      {
                        "type": "cash_flow|capital_allocation|payment_timing|risk_management",
                        "suggestion": "string",
                        "impact": "string",
                        "priority": "high|medium|low",
                        "timeframe": "string"
                      }
                    ],
                    "cashFlowForecast": "string",
                    "riskAlerts": ["string"]
                  }`
      },
      {
        role: "user",
        content: `Analyze working capital and provide optimization recommendations:

Recent Capital Entries:
${JSON.stringify(capitalEntries.slice(-20), null, 2)}

Financial Summary:
${JSON.stringify(financialSummary, null, 2)}

Upcoming Payments:
${JSON.stringify(upcomingPayments, null, 2)}

Provide recommendations for:
1. Cash flow optimization
2. Capital allocation efficiency
3. Payment timing strategies
4. Risk management measures
5. Working capital forecasting`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  /**
   * Smart inventory management recommendations
   */
  async getInventoryRecommendations(
    warehouseStock: WarehouseStock[],
    filterRecords: FilterRecord[],
    inventoryAnalytics: InventoryAnalyticsResponse
  ): Promise<{
    actions: Array<{
      stockId: string;
      action: 'filter' | 'move_to_final' | 'process' | 'hold' | 'sell';
      reasoning: string;
      urgency: 'high' | 'medium' | 'low';
      expectedBenefit: string;
    }>;
    insights: string;
    qualityAlerts: string[];
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an inventory management expert for agricultural commodities processing.
                  Analyze warehouse stock and processing data to recommend optimal inventory actions.
                  Respond with JSON in this exact format:
                  {
                    "actions": [
                      {
                        "stockId": "string",
                        "action": "filter|move_to_final|process|hold|sell",
                        "reasoning": "string",
                        "urgency": "high|medium|low",
                        "expectedBenefit": "string"
                      }
                    ],
                    "insights": "string",
                    "qualityAlerts": ["string"]
                  }`
      },
      {
        role: "user",
        content: `Analyze inventory and recommend optimal actions:

Current Warehouse Stock:
${JSON.stringify(warehouseStock, null, 2)}

Historical Filter Performance:
${JSON.stringify(filterRecords.slice(-10), null, 2)}

Inventory Analytics:
${JSON.stringify(inventoryAnalytics, null, 2)}

Recommend actions considering:
1. Stock aging and quality deterioration
2. Filtering efficiency and yields
3. Market demand and pricing
4. Storage capacity optimization
5. Processing workflow efficiency`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  // Financial Insights and Analytics

  /**
   * AI-powered financial trend analysis and predictions
   */
  async getFinancialTrendAnalysis(
    financialSummary: FinancialSummaryResponse,
    historicalData: any[]
  ): Promise<{
    trends: Array<{
      metric: string;
      trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
      confidence: number;
      prediction: string;
      recommendation: string;
    }>;
    predictions: {
      nextQuarter: any;
      risks: string[];
      opportunities: string[];
    };
    insights: string;
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a financial analyst specializing in trading business trend analysis and forecasting.
                  Analyze financial data to identify trends, predict future performance, and provide strategic insights.
                  Respond with JSON in this exact format:
                  {
                    "trends": [
                      {
                        "metric": "string",
                        "trend": "increasing|decreasing|stable|volatile",
                        "confidence": number,
                        "prediction": "string",
                        "recommendation": "string"
                      }
                    ],
                    "predictions": {
                      "nextQuarter": {},
                      "risks": ["string"],
                      "opportunities": ["string"]
                    },
                    "insights": "string"
                  }`
      },
      {
        role: "user",
        content: `Analyze financial trends and provide predictions:

Current Financial Summary:
${JSON.stringify(financialSummary, null, 2)}

Historical Financial Data:
${JSON.stringify(historicalData, null, 2)}

Analyze trends in:
1. Revenue and profitability
2. Cash flow patterns
3. Capital utilization
4. Cost structures
5. Market performance indicators`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  // Trading Decision Support

  /**
   * Market condition analysis for purchase timing
   */
  async getMarketTimingAnalysis(
    marketData: any,
    historicalPrices: any[],
    currentInventory: number
  ): Promise<{
    recommendation: 'buy_now' | 'wait' | 'sell_first' | 'hold_position';
    confidence: number;
    reasoning: string;
    priceTargets: {
      buyBelow: number;
      sellAbove: number;
    };
    marketOutlook: string;
    riskFactors: string[];
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a commodity trading market analyst. Analyze market conditions to recommend optimal timing for trading decisions.
                  Respond with JSON in this exact format:
                  {
                    "recommendation": "buy_now|wait|sell_first|hold_position",
                    "confidence": number,
                    "reasoning": "string",
                    "priceTargets": {
                      "buyBelow": number,
                      "sellAbove": number
                    },
                    "marketOutlook": "string",
                    "riskFactors": ["string"]
                  }`
      },
      {
        role: "user",
        content: `Analyze market timing for trading decisions:

Current Market Data:
${JSON.stringify(marketData, null, 2)}

Historical Price Trends:
${JSON.stringify(historicalPrices, null, 2)}

Current Inventory Level: ${currentInventory} kg

Provide timing analysis considering:
1. Current market conditions vs historical patterns
2. Seasonal trends and cyclical factors
3. Supply and demand dynamics
4. Risk factors and market volatility
5. Optimal entry and exit points`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  // Intelligent Reporting and Alerts

  /**
   * Generate AI-powered executive summary
   */
  async generateExecutiveSummary(
    financialSummary: FinancialSummaryResponse,
    tradingActivity: TradingActivityResponse,
    inventoryAnalytics: InventoryAnalyticsResponse,
    supplierPerformance: SupplierPerformanceResponse
  ): Promise<{
    summary: string;
    keyMetrics: Array<{
      metric: string;
      value: string;
      trend: 'up' | 'down' | 'stable';
      significance: 'high' | 'medium' | 'low';
    }>;
    priorities: string[];
    recommendations: string[];
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an executive business analyst. Create comprehensive business performance summaries for senior management.
                  Focus on key insights, trends, and actionable recommendations.
                  Respond with JSON in this exact format:
                  {
                    "summary": "string",
                    "keyMetrics": [
                      {
                        "metric": "string",
                        "value": "string",
                        "trend": "up|down|stable",
                        "significance": "high|medium|low"
                      }
                    ],
                    "priorities": ["string"],
                    "recommendations": ["string"]
                  }`
      },
      {
        role: "user",
        content: `Generate executive summary from business data:

Financial Performance:
${JSON.stringify(financialSummary, null, 2)}

Trading Activity:
${JSON.stringify(tradingActivity, null, 2)}

Inventory Analytics:
${JSON.stringify(inventoryAnalytics, null, 2)}

Supplier Performance:
${JSON.stringify(supplierPerformance, null, 2)}

Create executive summary covering:
1. Overall business performance
2. Key financial metrics and trends
3. Operational efficiency insights
4. Strategic priorities and recommendations
5. Risk factors and opportunities`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  /**
   * Detect anomalies in financial data
   */
  async detectAnomalies(
    recentData: any[],
    historicalBaseline: any[]
  ): Promise<{
    anomalies: Array<{
      type: 'financial' | 'operational' | 'inventory' | 'supplier';
      description: string;
      severity: 'critical' | 'warning' | 'info';
      impact: string;
      recommendation: string;
    }>;
    patterns: string[];
    alerts: string[];
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a business intelligence analyst specializing in anomaly detection.
                  Compare recent data patterns against historical baselines to identify significant deviations.
                  Respond with JSON in this exact format:
                  {
                    "anomalies": [
                      {
                        "type": "financial|operational|inventory|supplier",
                        "description": "string",
                        "severity": "critical|warning|info",
                        "impact": "string",
                        "recommendation": "string"
                      }
                    ],
                    "patterns": ["string"],
                    "alerts": ["string"]
                  }`
      },
      {
        role: "user",
        content: `Detect anomalies by comparing recent data to historical patterns:

Recent Data:
${JSON.stringify(recentData, null, 2)}

Historical Baseline:
${JSON.stringify(historicalBaseline, null, 2)}

Identify anomalies in:
1. Financial metrics and cash flow
2. Trading volumes and pricing
3. Inventory levels and turnover
4. Supplier performance deviations
5. Operational efficiency changes`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  /**
   * Generate contextual help and guidance
   */
  async getContextualHelp(
    currentPage: string,
    userRole: string,
    currentData: any
  ): Promise<{
    help: string;
    suggestions: string[];
    quickActions: Array<{
      action: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a business process assistant for WorkFlu trading management system.
                  Provide contextual help and actionable suggestions based on current page and user role.
                  Respond with JSON in this exact format:
                  {
                    "help": "string",
                    "suggestions": ["string"],
                    "quickActions": [
                      {
                        "action": "string",
                        "description": "string",
                        "priority": "high|medium|low"
                      }
                    ]
                  }`
      },
      {
        role: "user",
        content: `Provide contextual help for:

Current Page: ${currentPage}
User Role: ${userRole}
Current Data Context:
${JSON.stringify(currentData, null, 2)}

Provide:
1. Context-specific guidance
2. Role-appropriate suggestions
3. Actionable next steps
4. Best practices for current workflow`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  /**
   * General business chat assistant
   */
  async chatAssistant(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    businessContext: any
  ): Promise<{
    response: string;
    suggestions: string[];
    actionItems?: string[];
  }> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are WorkFlu AI, an intelligent business assistant for trading operations management.
                  You help with business decisions, data analysis, process optimization, and strategic planning.
                  Always provide practical, actionable advice based on business data and best practices.
                  Respond with JSON in this exact format:
                  {
                    "response": "string",
                    "suggestions": ["string"],
                    "actionItems": ["string"]
                  }`
      },
      {
        role: "user",
        content: `Business Context:
${JSON.stringify(businessContext, null, 2)}

Conversation History:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Current Message: ${message}

Provide a helpful response with actionable suggestions and any relevant action items.`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  // ======================================
  // WORKFLOW VALIDATION SYSTEM
  // ======================================

  /**
   * Extract requirements from business document (workflu.docx)
   */
  async extractRequirementsFromDoc(docChunks: string[]): Promise<WorkflowSpec> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a business analyst extracting structured workflow requirements from business documents.
                  Analyze the provided document content and extract a comprehensive WorkflowSpec covering all business stages.
                  Focus on identifying stages, fields, processes, roles, statuses, validations, and compliance rules.
                  
                  Respond with JSON in this exact format:
                  {
                    "stages": {
                      "capital": {
                        "fields": ["string"],
                        "processes": ["string"],
                        "roles": ["string"],
                        "statuses": ["string"],
                        "transitions": [{"from": "string", "to": "string", "conditions": ["string"]}],
                        "validations": ["string"],
                        "currencies": ["string"]
                      }
                    },
                    "overallRequirements": ["string"],
                    "complianceRules": ["string"]
                  }`
      },
      {
        role: "user",
        content: `Extract structured workflow requirements from this business document:

${docChunks.join('\n\n---CHUNK BREAK---\n\n')}

Identify and extract for each business stage (capital, purchases, warehouse, shipping, expenses, sales, revenues, users, reports):
1. Required fields and data elements
2. Business processes and workflows
3. User roles and permissions
4. Status transitions and states
5. Validation rules and constraints
6. Currency handling requirements
7. Compliance and regulatory requirements

Ensure comprehensive coverage of all operational aspects mentioned in the document.`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    try {
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result);
      
      // Try to extract JSON from the response if it's embedded in text
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondError) {
          console.error('Failed to parse extracted JSON:', secondError);
        }
      }
      
      // Return a structured error response
      throw new Error(`AI returned invalid JSON. Raw response: ${result.substring(0, 200)}...`);
    }
  }

  /**
   * Generate SystemSpec from current implementation
   */
  async generateSystemSpec(): Promise<SystemSpec> {
    try {
      // Read schema file
      const schemaPath = path.join(process.cwd(), 'shared', 'schema.ts');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');

      // Read routes file
      const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
      const routesContent = await fs.readFile(routesPath, 'utf-8');

      // Read key frontend files
      const frontendFiles = [
        'client/src/pages/Dashboard.tsx',
        'client/src/pages/Reports.tsx',
        'client/src/pages/WorkingCapital.tsx',
        'client/src/pages/Purchases.tsx',
        'client/src/pages/Warehouse.tsx',
        'client/src/pages/Orders.tsx',
        'client/src/pages/Settings.tsx'
      ];

      const frontendContent: { [key: string]: string } = {};
      for (const filePath of frontendFiles) {
        try {
          const fullPath = path.join(process.cwd(), filePath);
          frontendContent[filePath] = await fs.readFile(fullPath, 'utf-8');
        } catch (error) {
          console.warn(`Could not read frontend file: ${filePath}`);
          frontendContent[filePath] = '';
        }
      }

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are a system analyzer extracting the current implementation structure from code files.
                    Analyze the provided schema, routes, and frontend files to generate a comprehensive SystemSpec.
                    Extract tables, endpoints, UI flows, roles, and system capabilities.
                    
                    Respond with JSON in this exact format:
                    {
                      "tables": {
                        "tableName": {
                          "fields": ["string"],
                          "relationships": ["string"],
                          "enums": ["string"]
                        }
                      },
                      "endpoints": {
                        "/api/endpoint": {
                          "method": "GET|POST|PUT|DELETE",
                          "roles": ["string"],
                          "validation": "string"
                        }
                      },
                      "uiFlows": {
                        "pageName": {
                          "features": ["string"],
                          "actions": ["string"]
                        }
                      },
                      "currencies": ["string"],
                      "roles": ["string"],
                      "statuses": ["string"]
                    }`
        },
        {
          role: "user",
          content: `Analyze the current system implementation and extract structural information:

SCHEMA CONTENT:
${schemaContent}

ROUTES CONTENT:
${routesContent}

FRONTEND FILES:
${Object.entries(frontendContent).map(([file, content]) => `=== ${file} ===\n${content.substring(0, 2000)}`).join('\n\n')}

Extract:
1. Database tables with fields, relationships, and enums
2. API endpoints with methods, required roles, and validation
3. UI flows and features from frontend pages
4. Available currencies, user roles, and status values
5. System capabilities and constraints

Focus on structural metadata only - do not include sensitive data like specific IDs or personal information.`
        }
      ];

      const result = await this.createCompletion(messages, true);
      if (!result) {
        throw new Error('No response received from AI service');
      }
      return JSON.parse(result);
    } catch (error) {
      console.error('Error generating system spec:', error);
      throw new Error('Failed to generate system specification');
    }
  }

  /**
   * Compare WorkflowSpec against SystemSpec to generate GapReport
   */
  async compareSpecs(workflowSpec: WorkflowSpec, systemSpec: SystemSpec): Promise<GapReport> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a compliance analyst comparing business requirements against system implementation.
                  Analyze the WorkflowSpec (requirements) against SystemSpec (current implementation) to identify gaps.
                  Generate a comprehensive GapReport with detailed analysis for each workflow stage.
                  
                  Respond with JSON in this exact format:
                  {
                    "overallStatus": "matched|partial|missing",
                    "stages": {
                      "stageName": {
                        "status": "matched|partial|missing",
                        "missingItems": ["string"],
                        "extraItems": ["string"],
                        "misalignments": ["string"],
                        "severity": "low|medium|high|critical",
                        "remediation": ["string"]
                      }
                    },
                    "summary": {
                      "totalGaps": 0,
                      "criticalGaps": 0,
                      "highPriorityGaps": 0,
                      "recommendations": ["string"]
                    },
                    "generatedAt": "2025-09-19T08:00:00.000Z"
                  }`
      },
      {
        role: "user",
        content: `Compare business requirements against current system implementation:

WORKFLOW REQUIREMENTS (WorkflowSpec):
${JSON.stringify(workflowSpec, null, 2)}

CURRENT SYSTEM (SystemSpec):
${JSON.stringify(systemSpec, null, 2)}

Perform comprehensive gap analysis for each stage:
1. Capital management workflow
2. Purchase workflow  
3. Warehouse operations
4. Shipping processes
5. Expense management
6. Sales pipeline
7. Revenue tracking
8. User management
9. Reporting systems

For each stage, identify:
- Missing required features/fields
- Extra implementation not in requirements
- Misalignments between spec and implementation
- Severity level (low/medium/high/critical)
- Specific remediation steps

Provide overall assessment and prioritized recommendations for closing gaps.`
      }
    ];

    const result = await this.createCompletion(messages, true);
    if (!result) {
      throw new Error('No response received from AI service');
    }
    
    const gapReport = JSON.parse(result);
    gapReport.generatedAt = new Date().toISOString();
    return gapReport;
  }

  /**
   * Process business document and cache requirements
   */
  async processBusinessDocument(): Promise<WorkflowSpec> {
    try {
      const docPath = path.join(process.cwd(), 'attached_assets', 'workflu_1758260129381.docx');
      
      // Check if file exists
      await fs.access(docPath);
      
      // Convert docx to text using mammoth
      const result = await mammoth.extractRawText({ path: docPath });
      const docText = result.value;
      
      if (!docText || docText.length < 100) {
        throw new Error('Document appears to be empty or corrupted');
      }

      // Chunk the document to stay within token limits (approximate 4000 characters per chunk)
      const chunkSize = 4000;
      const chunks: string[] = [];
      for (let i = 0; i < docText.length; i += chunkSize) {
        chunks.push(docText.substring(i, i + chunkSize));
      }

      console.log(`Document processed: ${docText.length} characters, ${chunks.length} chunks`);

      // Extract requirements using AI
      const workflowSpec = await this.extractRequirementsFromDoc(chunks);
      
      return workflowSpec;
    } catch (error) {
      console.error('Error processing business document:', error);
      throw new Error('Failed to process business document');
    }
  }

  /**
   * Complete workflow validation pipeline
   */
  async validateWorkflowAgainstDocument(): Promise<GapReport> {
    try {
      console.log('Starting workflow validation pipeline...');
      
      // Step 1: Process business document and extract requirements
      console.log('Processing business document...');
      const workflowSpec = await this.processBusinessDocument();
      
      // Step 2: Generate current system specification
      console.log('Generating system specification...');
      const systemSpec = await this.generateSystemSpec();
      
      // Step 3: Compare specs and generate gap report
      console.log('Comparing specifications...');
      const gapReport = await this.compareSpecs(workflowSpec, systemSpec);
      
      console.log('Workflow validation completed successfully');
      return gapReport;
    } catch (error) {
      console.error('Error in workflow validation pipeline:', error);
      throw new Error('Failed to complete workflow validation');
    }
  }

  /**
   * Validate shipping workflow implementation against business document
   */
  async validateShippingWorkflow(): Promise<{
    compliance: 'compliant' | 'partial' | 'non-compliant';
    findings: string[];
    recommendations: string[];
    businessAlignment: number; // 0-100 percentage
  }> {
    try {
      console.log('Starting shipping workflow validation...');

      const shippingRequirements = `
      Based on the WorkFlu business document, the shipping workflow must:
      
      1. CAPITAL INTEGRATION:
         - Shipping costs must be funded from Working Capital (CapitalOut entries)
         - Support multi-currency (USD/ETB) with automatic conversion
         - Link shipping costs to shipping_leg_id/arrival_cost_id
         - Include transfer commission % when paid from capital
      
      2. WORKFLOW INTEGRATION:
         - Connect with warehouse operations (ship from warehouse stock)
         - Link to purchase orders and track shipments
         - Support final warehouse updates on delivery
         - Maintain data integrity with existing business rules
      
      3. COST TRACKING:
         - All costs normalized to USD for reporting
         - Support freight, insurance, customs, handling costs
         - Track payment methods (cash, advance, credit)
         - External funding option (doesn't affect capital)
      
      4. OPERATIONAL REQUIREMENTS:
         - Multiple shipping methods (sea, air, land, courier)
         - Shipment number generation and tracking
         - Origin/destination management
         - Status tracking (pending, in_transit, delivered, etc.)
         - Carrier management and performance tracking
      `;

      const currentImplementation = `
      SHIPPING SYSTEM IMPLEMENTATION:
      
      1. DATABASE SCHEMA:
         - carriers table with contact info and ratings
         - shipments table with proper relationships
         - shipmentItems linking warehouse stock to shipments
         - shippingCosts with multi-currency support and USD normalization
         - deliveryTracking for status history
      
      2. CAPITAL INTEGRATION:
         - addShippingCost method creates CapitalOut entries when fundingSource='capital'
         - Multi-currency support with automatic USD conversion
         - Exchange rate handling from settings
         - Proper linking to shipment IDs
      
      3. WAREHOUSE INTEGRATION:
         - createShipmentFromWarehouseStock method
         - Stock reservation/release functionality
         - Available stock filtering for shipping
         - Final warehouse updates on delivery
      
      4. API ENDPOINTS:
         - Complete CRUD operations for carriers, shipments, costs, tracking
         - Role-based access control (admin, warehouse, finance, sales)
         - Analytics and reporting endpoints
         - Integration endpoints for warehouse operations
      
      5. FRONTEND:
         - Comprehensive shipping management UI
         - Carrier management interface
         - Shipment creation from warehouse stock
         - Cost tracking with multi-currency support
         - Analytics dashboard with performance metrics
      `;

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are a business workflow compliance validator for WorkFlu trading system. 
                    Analyze if the shipping implementation aligns with business requirements.
                    Focus on capital integration, workflow consistency, and operational completeness.
                    Respond with JSON in this exact format:
                    {
                      "compliance": "compliant|partial|non-compliant",
                      "findings": ["finding1", "finding2"],
                      "recommendations": ["rec1", "rec2"],
                      "businessAlignment": 85
                    }`
        },
        {
          role: "user", 
          content: `BUSINESS REQUIREMENTS:\n${shippingRequirements}\n\nCURRENT IMPLEMENTATION:\n${currentImplementation}\n\nValidate compliance and provide detailed assessment.`
        }
      ];

      const response = await this.createCompletion(messages, true);
      const validation = JSON.parse(response || '{}');
      
      console.log('Shipping workflow validation completed');
      return validation;
    } catch (error) {
      console.error('Error in shipping workflow validation:', error);
      throw new Error('Failed to validate shipping workflow');
    }
  }
}

// Export singleton instance
export const aiService = WorkFluAIService.getInstance();