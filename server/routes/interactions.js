import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, isUsingPostgres, getMemoryStore, persistStore } from '../db.js';
import { analyzeInteraction, generateResponse } from '../ai.js';
import {
  createInteractionSchema,
  generateResponseSchema,
  updateInteractionSchema,
  sendResponseSchema,
  validate
} from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/interactions
 * Paginated, filterable, searchable list of customer interactions
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      status,
      priority,
      channel,
      deviceType,
      sentiment,
      search,
      page = 1,
      limit = 25
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    let allInteractions = [];
    const memory = getMemoryStore();

    if (isUsingPostgres()) {
      const sql = `
        SELECT
          i.*,
          c.name AS customer_name,
          c.email AS customer_email,
          c.company AS customer_company,
          c.tier AS customer_tier,
          u.name AS assigned_agent_name,
          u.email AS assigned_agent_email,
          u.avatar_url AS assigned_agent_avatar
        FROM interactions i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN users u ON i.assigned_agent_id = u.id
        ORDER BY i.created_at DESC
      `;
      const result = await query(sql);
      allInteractions = result.rows;
    } else {
      allInteractions = memory.interactions.map(i => {
        const c = memory.customers.find(cust => cust.id === i.customer_id) || {};
        const u = memory.users.find(usr => usr.id === i.assigned_agent_id) || {};
        return {
          ...i,
          customer_name: c.name || 'Unknown Customer',
          customer_email: c.email || '',
          customer_company: c.company || '',
          customer_tier: c.tier || 'Standard',
          assigned_agent_name: u.name || null,
          assigned_agent_email: u.email || null,
          assigned_agent_avatar: u.avatar_url || null
        };
      });
      // Sort newest first
      allInteractions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Apply Filters
    let filtered = allInteractions;

    if (status && status !== 'All') {
      filtered = filtered.filter(i => (i.status || '').toLowerCase() === status.toLowerCase());
    }
    if (priority && priority !== 'All') {
      filtered = filtered.filter(i => (i.priority || '').toLowerCase() === priority.toLowerCase());
    }
    if (channel && channel !== 'All') {
      filtered = filtered.filter(i => (i.channel || '').toLowerCase() === channel.toLowerCase());
    }
    if (deviceType && deviceType !== 'All') {
      filtered = filtered.filter(i => (i.device_type || '').toLowerCase() === deviceType.toLowerCase());
    }
    if (sentiment && sentiment !== 'All') {
      filtered = filtered.filter(i => (i.sentiment_label || '').toLowerCase() === sentiment.toLowerCase());
    }
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(i =>
        (i.subject && i.subject.toLowerCase().includes(q)) ||
        (i.raw_message && i.raw_message.toLowerCase().includes(q)) ||
        (i.customer_name && i.customer_name.toLowerCase().includes(q)) ||
        (i.customer_email && i.customer_email.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/interactions
 * Ingest new customer touchpoint & trigger Gemini analysis synchronously
 */
router.post('/', validate(createInteractionSchema), async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      channel,
      deviceType = 'Desktop',
      rawMessage,
      company = '',
      tier = 'Standard'
    } = req.validatedBody;

    const memory = getMemoryStore();

    // 1. Resolve or Create Customer
    let customer = null;
    if (isUsingPostgres()) {
      const custCheck = await query('SELECT * FROM customers WHERE email = $1', [customerEmail.toLowerCase()]);
      if (custCheck.rows.length > 0) {
        customer = custCheck.rows[0];
      } else {
        const custId = uuidv4();
        const insertCust = await query(
          `INSERT INTO customers (id, name, email, company, tier, preferred_channel)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [custId, customerName, customerEmail.toLowerCase(), company, tier, channel]
        );
        customer = insertCust.rows[0];
      }
    } else {
      customer = memory.customers.find(c => c.email.toLowerCase() === customerEmail.toLowerCase());
      if (!customer) {
        customer = {
          id: uuidv4(),
          name: customerName,
          email: customerEmail.toLowerCase(),
          company,
          tier,
          lifetime_value: tier === 'Enterprise' ? 25000 : tier === 'Gold' ? 10000 : 2500,
          phone: '',
          preferred_channel: channel,
          created_at: new Date().toISOString()
        };
        memory.customers.push(customer);
      }
    }

    // 2. Assign Default Agent (e.g. Elena Rostova or round robin)
    let assignedAgentId = memory.users[2]?.id || null; // Elena Rostova default for Tier 1 / Mobile

    // 3. Trigger Synchronous Gemini AI Analysis
    console.log(`[OmniX-AI] Analyzing interaction from ${customerName} via ${channel}...`);
    const aiAnalysis = await analyzeInteraction({
      customerName,
      channel,
      deviceType,
      rawMessage
    });

    const interactionId = uuidv4();
    const now = new Date().toISOString();
    const status = (aiAnalysis.churnRisk === 'Critical' || aiAnalysis.urgency === 'Urgent') ? 'Escalated' : 'Open';

    const newInteractionRecord = {
      id: interactionId,
      customer_id: customer.id,
      assigned_agent_id: assignedAgentId,
      channel,
      device_type: deviceType,
      subject: aiAnalysis.subject || `Inquiry: ${rawMessage.slice(0, 40)}`,
      raw_message: rawMessage,
      status,
      priority: aiAnalysis.urgency || 'Medium',
      category: aiAnalysis.category || 'Feature Request',
      sentiment_score: aiAnalysis.sentimentScore !== undefined ? aiAnalysis.sentimentScore : 0.0,
      sentiment_label: aiAnalysis.sentimentLabel || 'Neutral',
      churn_risk: aiAnalysis.churnRisk || 'Low',
      ai_summary: aiAnalysis.aiSummary,
      created_at: now,
      updated_at: now
    };

    // 4. Persist Interaction & Audit Trail
    if (isUsingPostgres()) {
      await query(
        `INSERT INTO interactions (id, customer_id, assigned_agent_id, channel, device_type, subject, raw_message, status, priority, category, sentiment_score, sentiment_label, churn_risk, ai_summary, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          newInteractionRecord.id,
          newInteractionRecord.customer_id,
          newInteractionRecord.assigned_agent_id,
          newInteractionRecord.channel,
          newInteractionRecord.device_type,
          newInteractionRecord.subject,
          newInteractionRecord.raw_message,
          newInteractionRecord.status,
          newInteractionRecord.priority,
          newInteractionRecord.category,
          newInteractionRecord.sentiment_score,
          newInteractionRecord.sentiment_label,
          newInteractionRecord.churn_risk,
          newInteractionRecord.ai_summary,
          newInteractionRecord.created_at,
          newInteractionRecord.updated_at
        ]
      );

      // Record first customer message in response log
      await query(
        `INSERT INTO interaction_responses (id, interaction_id, sender_id, responder_type, message, tone_used, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [uuidv4(), interactionId, null, 'Customer', rawMessage, null, now]
      );
    } else {
      memory.interactions.unshift(newInteractionRecord);
      memory.interaction_responses.push({
        id: uuidv4(),
        interaction_id: interactionId,
        sender_id: null,
        responder_type: 'Customer',
        message: rawMessage,
        tone_used: null,
        created_at: now
      });
      persistStore();
    }

    const assignedAgent = memory.users.find(u => u.id === assignedAgentId);

    const enriched = {
      ...newInteractionRecord,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_company: customer.company,
      customer_tier: customer.tier,
      customer_ltv: customer.lifetime_value,
      assigned_agent_name: assignedAgent?.name || null,
      assigned_agent_email: assignedAgent?.email || null,
      assigned_agent_avatar: assignedAgent?.avatar_url || null,
      ai_metadata: {
        source: aiAnalysis.source,
        modelUsed: aiAnalysis.modelUsed
      }
    };

    res.status(201).json({
      success: true,
      message: 'Interaction ingested and analyzed successfully',
      data: enriched
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/interactions/:id
 * Retrieve specific interaction with customer details, assigned agent, and conversation timeline
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const memory = getMemoryStore();

    let interaction = null;
    let responses = [];

    if (isUsingPostgres()) {
      const sql = `
        SELECT
          i.*,
          c.name AS customer_name,
          c.email AS customer_email,
          c.company AS customer_company,
          c.tier AS customer_tier,
          c.lifetime_value AS customer_ltv,
          c.phone AS customer_phone,
          c.preferred_channel AS customer_pref_channel,
          u.name AS assigned_agent_name,
          u.email AS assigned_agent_email,
          u.avatar_url AS assigned_agent_avatar,
          u.department AS assigned_agent_dept
        FROM interactions i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN users u ON i.assigned_agent_id = u.id
        WHERE i.id = $1
      `;
      const result = await query(sql, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Interaction not found' });
      }
      interaction = result.rows[0];

      const respResult = await query(
        `SELECT r.*, u.name as sender_name, u.avatar_url as sender_avatar
         FROM interaction_responses r
         LEFT JOIN users u ON r.sender_id = u.id
         WHERE r.interaction_id = $1
         ORDER BY r.created_at ASC`,
        [id]
      );
      responses = respResult.rows;
    } else {
      const found = memory.interactions.find(i => i.id === id);
      if (!found) {
        return res.status(404).json({ success: false, error: 'Interaction not found' });
      }
      const customer = memory.customers.find(c => c.id === found.customer_id) || {};
      const agent = memory.users.find(u => u.id === found.assigned_agent_id) || {};

      interaction = {
        ...found,
        customer_name: customer.name || 'Unknown Customer',
        customer_email: customer.email || '',
        customer_company: customer.company || '',
        customer_tier: customer.tier || 'Standard',
        customer_ltv: customer.lifetime_value || 0,
        customer_phone: customer.phone || '',
        customer_pref_channel: customer.preferred_channel || 'Mobile App',
        assigned_agent_name: agent.name || null,
        assigned_agent_email: agent.email || null,
        assigned_agent_avatar: agent.avatar_url || null,
        assigned_agent_dept: agent.department || null
      };

      responses = memory.interaction_responses
        .filter(r => r.interaction_id === id)
        .map(r => {
          const sender = memory.users.find(u => u.id === r.sender_id) || {};
          return {
            ...r,
            sender_name: sender.name || (r.responder_type === 'Customer' ? interaction.customer_name : 'Support Agent'),
            sender_avatar: sender.avatar_url || null
          };
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    res.json({
      success: true,
      data: {
        interaction,
        responses
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/interactions/:id
 * Update status, priority, or assigned agent
 */
router.patch('/:id', validate(updateInteractionSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedAgentId } = req.validatedBody;
    const memory = getMemoryStore();
    const now = new Date().toISOString();

    if (isUsingPostgres()) {
      const updates = [];
      const values = [];
      let idx = 1;

      if (status !== undefined) {
        updates.push(`status = $${idx++}`);
        values.push(status);
      }
      if (priority !== undefined) {
        updates.push(`priority = $${idx++}`);
        values.push(priority);
      }
      if (assignedAgentId !== undefined) {
        updates.push(`assigned_agent_id = $${idx++}`);
        values.push(assignedAgentId);
      }
      updates.push(`updated_at = $${idx++}`);
      values.push(now);
      values.push(id);

      const sql = `UPDATE interactions SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
      const result = await query(sql, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Interaction not found' });
      }
      return res.json({ success: true, message: 'Updated successfully', data: result.rows[0] });
    } else {
      const item = memory.interactions.find(i => i.id === id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Interaction not found' });
      }
      if (status !== undefined) item.status = status;
      if (priority !== undefined) item.priority = priority;
      if (assignedAgentId !== undefined) item.assigned_agent_id = assignedAgentId;
      item.updated_at = now;
      persistStore();
      return res.json({ success: true, message: 'Updated successfully', data: item });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/interactions/:id/analyze
 * Force re-run Gemini sentiment & intent analysis on demand
 */
router.post('/:id/analyze', async (req, res, next) => {
  try {
    const { id } = req.params;
    const memory = getMemoryStore();

    let target = null;
    let customerName = 'Customer';

    if (isUsingPostgres()) {
      const resInter = await query(
        `SELECT i.*, c.name as customer_name FROM interactions i
         LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = $1`,
        [id]
      );
      if (resInter.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Interaction not found' });
      }
      target = resInter.rows[0];
      customerName = target.customer_name || 'Customer';
    } else {
      target = memory.interactions.find(i => i.id === id);
      if (!target) {
        return res.status(404).json({ success: false, error: 'Interaction not found' });
      }
      const cust = memory.customers.find(c => c.id === target.customer_id);
      if (cust) customerName = cust.name;
    }

    const aiAnalysis = await analyzeInteraction({
      customerName,
      channel: target.channel,
      deviceType: target.device_type,
      rawMessage: target.raw_message
    });

    const now = new Date().toISOString();

    if (isUsingPostgres()) {
      const updateSql = `
        UPDATE interactions
        SET
          category = $1,
          sentiment_score = $2,
          sentiment_label = $3,
          churn_risk = $4,
          priority = $5,
          ai_summary = $6,
          updated_at = $7
        WHERE id = $8
        RETURNING *
      `;
      const updated = await query(updateSql, [
        aiAnalysis.category,
        aiAnalysis.sentimentScore,
        aiAnalysis.sentimentLabel,
        aiAnalysis.churnRisk,
        aiAnalysis.urgency || target.priority,
        aiAnalysis.aiSummary,
        now,
        id
      ]);
      return res.json({
        success: true,
        message: 'Interaction re-analyzed via Gemini AI',
        data: updated.rows[0],
        analysis: aiAnalysis
      });
    } else {
      target.category = aiAnalysis.category;
      target.sentiment_score = aiAnalysis.sentimentScore;
      target.sentiment_label = aiAnalysis.sentimentLabel;
      target.churn_risk = aiAnalysis.churnRisk;
      target.priority = aiAnalysis.urgency || target.priority;
      target.ai_summary = aiAnalysis.aiSummary;
      target.updated_at = now;
      persistStore();
      return res.json({
        success: true,
        message: 'Interaction re-analyzed via Gemini AI',
        data: target,
        analysis: aiAnalysis
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/interactions/:id/generate-response
 * Invoke Gemini API to generate smart response draft based on selected tone
 */
router.post('/:id/generate-response', validate(generateResponseSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tone, agentInstructions } = req.validatedBody;
    const memory = getMemoryStore();

    let target = null;
    let customerName = 'Customer';

    if (isUsingPostgres()) {
      const resInter = await query(
        `SELECT i.*, c.name as customer_name FROM interactions i
         LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = $1`,
        [id]
      );
      if (resInter.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Interaction not found' });
      }
      target = resInter.rows[0];
      customerName = target.customer_name || 'Customer';
    } else {
      target = memory.interactions.find(i => i.id === id);
      if (!target) {
        return res.status(404).json({ success: false, error: 'Interaction not found' });
      }
      const cust = memory.customers.find(c => c.id === target.customer_id);
      if (cust) customerName = cust.name;
    }

    const aiDraft = await generateResponse({
      customerName,
      channel: target.channel,
      deviceType: target.device_type,
      rawMessage: target.raw_message,
      sentimentLabel: target.sentiment_label || 'Neutral',
      category: target.category || 'General Inquiry',
      tone,
      agentInstructions
    });

    res.json({
      success: true,
      data: {
        interactionId: id,
        toneRequested: tone,
        responseDraft: aiDraft.responseDraft,
        internalNotes: aiDraft.internalNotes,
        modelUsed: aiDraft.modelUsed,
        source: aiDraft.source
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/interactions/:id/responses
 * Post an agent or customer message to thread & optionally mark resolved
 */
router.post('/:id/responses', validate(sendResponseSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, responderType, toneUsed, senderId, markResolved } = req.validatedBody;
    const memory = getMemoryStore();
    const now = new Date().toISOString();
    const responseId = uuidv4();

    // Default sender to an agent if not provided
    const effectiveSenderId = senderId || memory.users[2]?.id || null;

    let createdResponse = null;

    if (isUsingPostgres()) {
      const resInsert = await query(
        `INSERT INTO interaction_responses (id, interaction_id, sender_id, responder_type, message, tone_used, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [responseId, id, effectiveSenderId, responderType, message, toneUsed || null, now]
      );
      createdResponse = resInsert.rows[0];

      if (markResolved) {
        await query(`UPDATE interactions SET status = 'Resolved', updated_at = $1 WHERE id = $2`, [now, id]);
      } else {
        await query(`UPDATE interactions SET updated_at = $1 WHERE id = $2`, [now, id]);
      }
    } else {
      createdResponse = {
        id: responseId,
        interaction_id: id,
        sender_id: effectiveSenderId,
        responder_type: responderType,
        message,
        tone_used: toneUsed || null,
        created_at: now
      };
      memory.interaction_responses.push(createdResponse);

      const target = memory.interactions.find(i => i.id === id);
      if (target) {
        if (markResolved) target.status = 'Resolved';
        target.updated_at = now;
      }
      persistStore();
    }

    const sender = memory.users.find(u => u.id === effectiveSenderId) || {};

    res.status(201).json({
      success: true,
      message: markResolved ? 'Response sent and interaction marked Resolved' : 'Response posted successfully',
      data: {
        ...createdResponse,
        sender_name: sender.name || 'Support Agent',
        sender_avatar: sender.avatar_url || null
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

