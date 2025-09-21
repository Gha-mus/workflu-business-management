import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth";
import { DocumentService, upload } from "../documentService";
import { auditService } from "../auditService";

export const documentsRouter = Router();

const documentService = new DocumentService();

// GET /api/documents (with filtering)
documentsRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const { search, category, status, limit, offset } = req.query;
    
    if (search || category || status) {
      // Use search functionality when filters are provided
      const searchRequest = {
        query: search as string || '',
        category: category as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };
      const searchResponse = await storage.searchDocuments(searchRequest);
      res.json(searchResponse);
    } else {
      // Return all documents when no filters
      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };
      const documents = await storage.getDocuments(options);
      res.json(documents);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

// GET /api/documents/search (BEFORE /:id route)
documentsRouter.get("/search", isAuthenticated, async (req, res) => {
  try {
    const searchRequest = {
      query: req.query.query as string || '',
      category: req.query.category as string,
      status: req.query.status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };
    const results = await storage.searchDocuments(searchRequest, (req.user as any)?.claims?.sub);
    res.json(results);
  } catch (error) {
    console.error("Error searching documents:", error);
    res.status(500).json({ message: "Failed to search documents" });
  }
});

// GET /api/documents/statistics (BEFORE /:id route)
documentsRouter.get("/statistics", isAuthenticated, async (req, res) => {
  try {
    const statistics = await storage.getDocumentStatistics();
    res.json(statistics);
  } catch (error) {
    console.error("Error fetching document statistics:", error);
    res.status(500).json({ message: "Failed to fetch document statistics" });
  }
});

// GET /api/documents/analytics (BEFORE /:id route)
documentsRouter.get("/analytics", 
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const analytics = await storage.getDocumentAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching document analytics:", error);
      res.status(500).json({ message: "Failed to fetch document analytics" });
    }
  }
);

// GET /api/documents/activity (BEFORE /:id route)
documentsRouter.get("/activity", isAuthenticated, async (req, res) => {
  try {
    const activity = await storage.getRecentDocumentActivity();
    res.json(activity);
  } catch (error) {
    console.error("Error fetching document activity:", error);
    res.status(500).json({ message: "Failed to fetch document activity" });
  }
});

// POST /api/documents/upload
documentsRouter.post("/upload",
  isAuthenticated,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const document = await DocumentService.processFileUpload(req.file, {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags ? (typeof req.body.tags === 'string' ? req.body.tags.split(',').map((t: string) => t.trim()) : JSON.parse(req.body.tags)) : [],
        uploadedBy: (req.user as any)?.claims?.sub || 'unknown'
      });

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'document_management',
          severity: 'info' as const
        },
        {
          entityType: 'documents',
          entityId: document.id,
          action: 'create',
          operationType: 'document_management',
          description: `Uploaded document: ${document.title}`,
          newValues: document
        }
      );

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  }
);

// GET /api/documents/:id (AFTER specific routes)
documentsRouter.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const document = await storage.getDocument(id, (req.user as any)?.claims?.sub);
    res.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Failed to fetch document" });
  }
});

// DELETE /api/documents/:id (AFTER specific routes)
documentsRouter.delete("/:id",
  isAuthenticated,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      await DocumentService.deleteDocument(id, (req.user as any)?.claims?.sub || 'unknown');

      // Create audit log
      await auditService.logOperation(
        {
          userId: (req.user as any)?.claims?.sub || 'unknown',
          userName: (req.user as any)?.claims?.email || 'Unknown',
          source: 'document_management',
          severity: 'info' as const
        },
        {
          entityType: 'documents',
          entityId: id,
          action: 'delete',
          operationType: 'document_management',
          description: `Deleted document: ${id}`,
          newValues: null
        }
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  }
);