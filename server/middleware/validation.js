import { z } from 'zod';

export const createInteractionSchema = z.object({
  customerName: z.string().min(2, "Name is required and must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  channel: z.enum(['Web Chat', 'Mobile App', 'Email', 'Social', 'Voice']),
  deviceType: z.enum(['Desktop', 'Android App', 'iOS App', 'Mobile Web']).default('Desktop'),
  rawMessage: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message too long (max 2000 characters)"),
  company: z.string().optional(),
  tier: z.enum(['Standard', 'Silver', 'Gold', 'Enterprise']).optional().default('Standard')
});

export const generateResponseSchema = z.object({
  tone: z.enum(['Empathetic', 'Executive', 'Consultative', 'De-escalation']),
  agentInstructions: z.string().optional()
});

export const updateInteractionSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Escalated']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  assignedAgentId: z.string().uuid("Invalid Agent UUID").optional().nullable()
});

export const createKbArticleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  tags: z.array(z.string()).optional().default([])
});

export const sendResponseSchema = z.object({
  message: z.string().min(2, "Message cannot be empty"),
  responderType: z.enum(['Agent', 'Customer', 'AI_Draft']).default('Agent'),
  toneUsed: z.string().optional(),
  senderId: z.string().uuid().optional().nullable(),
  markResolved: z.boolean().optional().default(false)
});

export const updateSettingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  modelName: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  autoPersonalization: z.boolean().optional()
});

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      return res.status(400).json({ success: false, error: "Invalid request payload" });
    }
  };
}

