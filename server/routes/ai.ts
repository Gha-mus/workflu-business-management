import { Router } from "express";
import { isAuthenticated } from "../core/auth";
import { aiService } from "../services/openai/aiService";
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
    const recommendation = await aiService.getPurchaseRecommendations(validatedData.historicalPurchases, validatedData.currentMarketConditions, validatedData.availableCapital);
    res.json(recommendation);
  } catch (error) {
    console.error("Error getting purchase recommendation:", error);
    if (error instanceof Error && error.message.includes('parse')) {
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
    const recommendation = await aiService.getSupplierRecommendations(validatedData.suppliers, validatedData.supplierPerformance, validatedData.currentNeeds);
    res.json(recommendation);
  } catch (error) {
    console.error("Error getting supplier recommendation:", error);
    if (error instanceof Error && error.message.includes('parse')) {
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
    const optimization = await aiService.getCapitalOptimizationSuggestions(validatedData.capitalEntries, validatedData.financialSummary, validatedData.upcomingPayments);
    res.json(optimization);
  } catch (error) {
    console.error("Error getting capital optimization:", error);
    if (error instanceof Error && error.message.includes('parse')) {
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
    const response = await aiService.chatAssistant(validatedData.message, validatedData.businessContext, validatedData.conversationHistory);
    res.json(response);
  } catch (error) {
    console.error("Error in AI chat:", error);
    if (error instanceof Error && error.message.includes('parse')) {
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
    if (error instanceof Error && error.message.includes('parse')) {
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
    const summary = await aiService.generateExecutiveSummary({}, {}, {}, {});
    res.json(summary);
  } catch (error) {
    console.error("Error getting executive summary:", error);
    if (error instanceof Error && error.message.includes('parse')) {
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
    if (error instanceof Error && error.message.includes('parse')) {
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
    if (error instanceof Error && error.message.includes('parse')) {
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
    if (error instanceof Error && error.message.includes('parse')) {
      res.status(422).json({ 
        message: "AI response could not be parsed. The service returned fallback data.",
        error: "Invalid AI response format"
      });
    } else {
      res.status(500).json({ message: "Failed to analyze supplier performance" });
    }
  }
});