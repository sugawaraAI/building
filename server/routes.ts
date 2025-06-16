import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContractSchema, contractDataSchema } from "@shared/schema";
import { z } from "zod";
import puppeteer from "puppeteer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contract Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getContractTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getContractTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Contracts
  app.get("/api/contracts", async (req, res) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(validatedData);
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contract data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contract" });
    }
  });

  app.put("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContractSchema.partial().parse(req.body);
      const contract = await storage.updateContract(id, validatedData);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contract data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contract" });
    }
  });

  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContract(id);
      if (!deleted) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });

  // PDF Generation
  app.post("/api/contracts/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      const template = await storage.getContractTemplate(contract.templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Generate HTML from template and data
      let html = template.template;
      const data = contract.data as Record<string, any>;
      
      // Simple template replacement (in production, use a proper template engine)
      for (const [key, value] of Object.entries(data)) {
        const placeholder = `{{${key}}}`;
        html = html.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value || ''));
      }

      // Add CSS styling for PDF
      const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Noto Sans JP', sans-serif; 
              line-height: 1.6; 
              margin: 40px;
              color: #333;
            }
            .contract-document { max-width: 800px; margin: 0 auto; }
            .contract-title { 
              text-align: center; 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 30px;
              border-bottom: 2px solid #1976D2;
              padding-bottom: 10px;
            }
            .contract-parties { margin: 30px 0; }
            .employer-info, .employee-info { 
              margin: 20px 0; 
              padding: 15px;
              background: #f8f9fa;
              border-left: 4px solid #1976D2;
            }
            .contract-intro { 
              margin: 30px 0; 
              text-align: center;
              font-weight: 500;
            }
            .clause { 
              margin: 25px 0; 
              padding: 15px 0;
              border-bottom: 1px solid #eee;
            }
            .clause h4 { 
              font-weight: bold; 
              margin-bottom: 10px;
              color: #1976D2;
            }
            .contract-footer { 
              margin-top: 50px; 
              text-align: center;
              border-top: 2px solid #1976D2;
              padding-top: 20px;
            }
            .signature-section { margin-top: 30px; }
            h3 { color: #1976D2; margin-bottom: 10px; }
            p { margin: 8px 0; }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;

      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true
      });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contract-${id}.pdf"`);
      res.send(pdf);

    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
