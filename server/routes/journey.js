import express from 'express';
import { query, isUsingPostgres, getMemoryStore } from '../db.js';

const router = express.Router();

/**
 * GET /api/customers
 * List customers with aggregated omnichannel metrics
 */
router.get('/customers', async (req, res, next) => {
  try {
    const memory = getMemoryStore();
    let customers = [];
    let interactions = [];

    if (isUsingPostgres()) {
      const custRes = await query('SELECT * FROM customers ORDER BY lifetime_value DESC');
      const intRes = await query('SELECT * FROM interactions ORDER BY created_at DESC');
      customers = custRes.rows;
      interactions = intRes.rows;
    } else {
      customers = [...memory.customers];
      interactions = [...memory.interactions];
    }

    const customerList = customers.map(c => {
      const custInteractions = interactions.filter(i => i.customer_id === c.id);
      const totalTouchpoints = custInteractions.length;

      // Channels used
      const channelsUsed = Array.from(new Set(custInteractions.map(i => i.channel)));
      const latestInteraction = custInteractions[0] || null;

      // Determine overall churn risk
      const hasCritical = custInteractions.some(i => i.churn_risk === 'Critical');
      const hasHigh = custInteractions.some(i => i.churn_risk === 'High');
      const overallChurnRisk = hasCritical ? 'Critical' : hasHigh ? 'High' : (totalTouchpoints > 0 ? (latestInteraction?.churn_risk || 'Low') : 'Low');

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company,
        tier: c.tier,
        lifetimeValue: parseFloat(c.lifetime_value || 0),
        preferredChannel: c.preferred_channel || 'Mobile App',
        totalTouchpoints,
        channelsUsed,
        overallChurnRisk,
        latestSubject: latestInteraction?.subject || 'No recent activity',
        latestSentiment: latestInteraction?.sentiment_label || 'Neutral',
        lastActive: latestInteraction?.created_at || c.created_at
      };
    });

    res.json({
      success: true,
      data: customerList
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/customers/:id/journey
 * Retrieve comprehensive omnichannel timeline and journey stages for a specific customer
 */
router.get('/customers/:id/journey', async (req, res, next) => {
  try {
    const { id } = req.params;
    const memory = getMemoryStore();

    let customer = null;
    let customerInteractions = [];

    if (isUsingPostgres()) {
      const custRes = await query('SELECT * FROM customers WHERE id = $1', [id]);
      if (custRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      customer = custRes.rows[0];

      const intRes = await query(
        `SELECT i.*, u.name as assigned_agent_name
         FROM interactions i
         LEFT JOIN users u ON i.assigned_agent_id = u.id
         WHERE i.customer_id = $1
         ORDER BY i.created_at ASC`,
        [id]
      );
      customerInteractions = intRes.rows;
    } else {
      customer = memory.customers.find(c => c.id === id);
      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }
      customerInteractions = memory.interactions
        .filter(i => i.customer_id === id)
        .map(i => {
          const agent = memory.users.find(u => u.id === i.assigned_agent_id);
          return {
            ...i,
            assigned_agent_name: agent?.name || null
          };
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    // Touchpoint channel breakdown
    const channelStats = {};
    customerInteractions.forEach(i => {
      channelStats[i.channel] = (channelStats[i.channel] || 0) + 1;
    });

    // Sentiment trajectory
    const sentimentTrajectory = customerInteractions.map(i => ({
      date: new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: parseFloat(i.sentiment_score || 0),
      label: i.sentiment_label,
      channel: i.channel
    }));

    // Journey stages computation
    const hasEscalations = customerInteractions.some(i => i.status === 'Escalated' || i.churn_risk === 'Critical');
    const allResolved = customerInteractions.length > 0 && customerInteractions.every(i => i.status === 'Resolved');

    let currentStage = 'Active Engagement';
    if (hasEscalations) {
      currentStage = 'Friction & Retention Threat';
    } else if (allResolved) {
      currentStage = 'Advocacy & Loyal Retention';
    } else if (customerInteractions.length <= 1) {
      currentStage = 'Initial Onboarding';
    }

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          company: customer.company,
          tier: customer.tier,
          lifetimeValue: parseFloat(customer.lifetime_value || 0),
          phone: customer.phone,
          preferredChannel: customer.preferred_channel
        },
        currentStage,
        totalTouchpoints: customerInteractions.length,
        channelDistribution: Object.entries(channelStats).map(([channel, count]) => ({ channel, count })),
        sentimentTrajectory,
        timeline: customerInteractions
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

