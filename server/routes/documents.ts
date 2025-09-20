import { Router } from "express";
import { storage } from "../core/storage";
import { isAuthenticated, requireRole } from "../core/auth/replitAuth";
import { DocumentService, upload } from "../documentService";
import { auditService } from "../auditService";

export const documentsRouter = Router();

const documentService = new DocumentService();

// GET /api/documents
documentsRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const documents = await storage.getDocuments();
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
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

      const document = await documentService.uploadDocument(req.file, {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        uploadedBy: req.user!.id
      });

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "CREATE",
        entityType: "document",
        entityId: document.id,
        description: `Uploaded document: ${document.title}`,
        previousState: null,
        newState: document
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  }
);

// GET /api/documents/:id
documentsRouter.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const document = await storage.getDocument(id);
    res.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Failed to fetch document" });
  }
});

// DELETE /api/documents/:id
documentsRouter.delete("/:id",
  isAuthenticated,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      await documentService.deleteDocument(id, req.user!.id);

      // Create audit log
      await auditService.logAction({
        userId: req.user!.id,
        action: "DELETE",
        entityType: "document",
        entityId: id,
        description: `Deleted document: ${id}`,
        previousState: null,
        newState: null
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  }
);

// GET /api/documents/search
documentsRouter.get("/search", isAuthenticated, async (req, res) => {
  try {
    const results = await documentService.searchDocuments(req.query);
    res.json(results);
  } catch (error) {
    console.error("Error searching documents:", error);
    res.status(500).json({ message: "Failed to search documents" });
  }
});