import { Router } from "express";
import { isAuthenticated } from "../core/auth";
import { aiService } from "../services/openai/aiService";
import { AIServiceError, AI_ERROR_CODES } from "../services/openai/client";
import {
  aiPurchaseRecommendationRequestSchema,
  aiSupplierRecommendationRequestSchema,
  aiCapitalOptimizationRequestSchema,
  aiChatRequestSchema,
  aiContextualHelpRequestSchema
} from "@shared/schema";

export const aiRouter = Router();

// POST /api/ai/purchase-recommendation
aiRouter.post("/purchase-recommendation", isAuthenticated, async (req, res) => {
  try {
    const validatedData = aiPurchaseRecommendationRequestSchema.parse(req.body);
    const recommendation = await aiService.getPurchaseRecommendations(validatedData.historicalPurchases || [], validatedData.currentMarketConditions || {}, validatedData.availableCapital || 0);
    res.json(recommendation);
  } catch (error) {
    console.error("Error getting purchase recommendation:", error);
    if (error instanceof AIServiceError) {
      const statusCode = error.code === AI_ERROR_CODES.RATE_LIMITED ? 429 : 503;
      res.status(statusCode).json({ 
        message: error.message,
        code: error.code
      });
    } else if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to get purchase recommendation" });
    }
  }
});

// POST /api/ai/supplier-recommendation
aiRouter.post("/supplier-recommendation", isAuthenticated, async (req, res) => {
  try {
    const validatedData = aiSupplierRecommendationRequestSchema.parse(req.body);
    const recommendation = await aiService.getSupplierRecommendations(
      validatedData.suppliers || [],
      (validatedData.supplierPerformance || {
        suppliers: [],
        summary: {
          totalSuppliers: 0,
          averageRating: 0,
          topPerformers: [],
          riskFactors: []
        }
      }) as any,
      (validatedData.currentNeeds || {
        quantity: validatedData.quantity || 0,
        quality: validatedData.quality || '',
        budget: validatedData.budget || 0
      }) as any
    );
    res.json(recommendation);
  } catch (error) {
    console.error("Error getting supplier recommendation:", error);
    if (error instanceof AIServiceError) {
      const statusCode = error.code === AI_ERROR_CODES.RATE_LIMITED ? 429 : 503;
      res.status(statusCode).json({ 
        message: error.message,
        code: error.code
      });
    } else if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to get supplier recommendation" });
    }
  }
});

// POST /api/ai/capital-optimization
aiRouter.post("/capital-optimization", isAuthenticated, async (req, res) => {
  try {
    const validatedData = aiCapitalOptimizationRequestSchema.parse(req.body);
    const optimization = await aiService.getCapitalOptimizationSuggestions(
      validatedData.capitalEntries || [],
      (validatedData.financialSummary || {
        exchangeRate: 1,
        summary: {
          totalPurchases: 0,
          currentBalance: 0,
          capitalIn: 0,
          capitalOut: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalInventoryValue: 0,
          netPosition: 0
        },
        currencyBreakdown: {
          usd: { amount: 0, count: 0 },
          etb: { amount: 0, count: 0 }
        }
      }) as any,
      validatedData.upcomingPayments || []
    );
    res.json(optimization);
  } catch (error) {
    console.error("Error getting capital optimization:", error);
    if (error instanceof AIServiceError) {
      const statusCode = error.code === AI_ERROR_CODES.RATE_LIMITED ? 429 : 503;
      res.status(statusCode).json({ 
        message: error.message,
        code: error.code
      });
    } else if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to get capital optimization" });
    }
  }
});

// POST /api/ai/chat
aiRouter.post("/chat", isAuthenticated, async (req, res) => {
  try {
    const validatedData = aiChatRequestSchema.parse(req.body);
    const response = await aiService.chatAssistant(
      validatedData.message,
      validatedData.conversationHistory || [],
      validatedData.businessContext || ''
    );
    res.json(response);
  } catch (error) {
    console.error("Error in AI chat:", error);
    if (error instanceof AIServiceError) {
      const statusCode = error.code === AI_ERROR_CODES.RATE_LIMITED ? 429 : 503;
      res.status(statusCode).json({ 
        message: error.message,
        code: error.code
      });
    } else if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  }
});

// POST /api/ai/contextual-help
aiRouter.post("/contextual-help", isAuthenticated, async (req, res) => {
  try {
    const validatedData = aiContextualHelpRequestSchema.parse(req.body);
    const help = await aiService.getContextualHelp(validatedData.currentPage, validatedData.userRole, validatedData.currentData);
    res.json(help);
  } catch (error) {
    console.error("Error getting contextual help:", error);
    if (error instanceof AIServiceError) {
      const statusCode = error.code === AI_ERROR_CODES.RATE_LIMITED ? 429 : 503;
      res.status(statusCode).json({ 
        message: error.message,
        code: error.code
      });
    } else if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to get contextual help" });
    }
  }
});

// GET /api/ai/executive-summary
aiRouter.get("/executive-summary", isAuthenticated, async (req, res) => {
  try {
    const summary = await aiService.generateExecutiveSummary(
      {
        exchangeRate: 1,
        summary: {
          totalPurchases: 0,
          currentBalance: 0,
          capitalIn: 0,
          capitalOut: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          totalInventoryValue: 0,
          netPosition: 0
        },
        currencyBreakdown: {
          usd: { amount: 0, count: 0 },
          etb: { amount: 0, count: 0 }
        }
      },
      { orderFulfillment: { 
        stats: { total: 0, pending: 0, cancelled: 0, completed: 0 }, 
        analysis: [] 
      } },
      { total: 0, pending: 0, cancelled: 0, completed: 0 },
      { total: 0, pending: 0, cancelled: 0, completed: 0 }
    );
    res.json(summary);
  } catch (error) {
    console.error("Error getting executive summary:", error);
    if (error instanceof AIServiceError) {
      const statusCode = error.code === AI_ERROR_CODES.RATE_LIMITED ? 429 : 503;
      res.status(statusCode).json({ 
        message: error.message,
        code: error.code
      });
    } else if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to get executive summary" });
    }
  }
});

// GET /api/ai/anomaly-detection
aiRouter.get("/anomaly-detection", isAuthenticated, async (req, res) => {
  try {
    const anomalies = await aiService.detectAnomalies([], []);
    res.json(anomalies);
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    if (error instanceof AIServiceError) {
      const statusCode = error.code === AI_ERROR_CODES.RATE_LIMITED ? 429 : 503;
      res.status(statusCode).json({ 
        message: error.message,
        code: error.code
      });
    } else if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to detect anomalies" });
    }
  }
});

// GET /api/ai/market-timing
aiRouter.get("/market-timing", isAuthenticated, async (req, res) => {
  try {
    const timing = await aiService.getMarketTimingAnalysis({}, [], 0);
    res.json(timing);
  } catch (error) {
    console.error("Error getting market timing:", error);
    if (error instanceof AIServiceError) {
      const statusCode = error.code === AI_ERROR_CODES.RATE_LIMITED ? 429 : 503;
      res.status(statusCode).json({ 
        message: error.message,
        code: error.code
      });
    } else if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to get market timing" });
    }
  }
});

// POST /api/ai/supplier-performance
aiRouter.post("/supplier-performance", isAuthenticated, async (req, res) => {
  try {
    const { supplierData, performanceMetrics } = req.body;
    const analysis = await aiService.getSupplierPerformanceAnalysis(supplierData || [], performanceMetrics || {});
    res.json(analysis);
  } catch (error) {
    console.error("Error analyzing supplier performance:", error);
    if (error instanceof AIServiceError) {
      const statusCode = error.code === AI_ERROR_CODES.RATE_LIMITED ? 429 : 503;
      res.status(statusCode).json({ 
        message: error.message,
        code: error.code
      });
    } else if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to analyze supplier performance" });
    }
  }
});