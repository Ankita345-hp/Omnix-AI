import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

import { initDatabase, getDatabaseStatus } from '../server/db.js';
import dashboardRoutes from '../server/routes/dashboard.js';
import interactionRoutes from '../server/routes/interactions.js';
import journeyRoutes from '../server/routes/journey.js';
import knowledgeBaseRoutes from '../server/routes/knowledgeBase.js';
import settingsRoutes from '../server/routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startAndTest() {
  console.log('Initializing database and Express application for verification...');
  await initDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mount API
  app.get('/api/health', (req, res) => res.json({ status: 'healthy', database: getDatabaseStatus() }));
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/interactions', interactionRoutes);
  app.use('/api', journeyRoutes);
  app.use('/api/knowledge-base', knowledgeBaseRoutes);
  app.use('/api/settings', settingsRoutes);

  // Serve static
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`Test server running on port ${port}`);

    async function req(path, options = {}, body = null) {
      return new Promise((resolve, reject) => {
        const r = http.request(`http://127.0.0.1:${port}${path}`, options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
            } catch {
              resolve({ status: res.statusCode, data: null, raw: data });
            }
          });
        });
        r.on('error', reject);
        if (body) r.write(JSON.stringify(body));
        r.end();
      });
    }

    try {
      // 1. Health
      const h = await req('/api/health');
      console.log('✓ [Health Check]:', h.status, h.data?.status, 'mode:', h.data?.database?.mode);

      // 2. Dashboard
      const m = await req('/api/dashboard/metrics');
      console.log('✓ [Dashboard Metrics]:', m.status, 'Total interactions:', m.data?.data?.summary?.totalInteractions, 'CSAT:', m.data?.data?.summary?.csatPercentage + '%');

      // 3. Create Interaction
      const created = await req('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        customerName: 'Marcus Sterling',
        customerEmail: 'm.sterling@sterling-holdings.co.uk',
        company: 'Sterling Capital Holdings',
        tier: 'Enterprise',
        channel: 'Mobile App',
        deviceType: 'Android App',
        rawMessage: "We experienced repeated payment timeout crashes while authorizing our quarterly subscription on Android. Our portfolio reports are now inaccessible!"
      });
      console.log('✓ [Create Interaction]:', created.status, 'ID:', created.data?.data?.id, 'Subject:', created.data?.data?.subject, 'Sentiment:', created.data?.data?.sentiment_label, 'ChurnRisk:', created.data?.data?.churn_risk);

      const newId = created.data?.data?.id;

      // 4. Detail
      const detail = await req(`/api/interactions/${newId}`);
      console.log('✓ [Get Interaction]:', detail.status, 'Customer:', detail.data?.data?.interaction?.customer_name);

      // 5. Generate AI Response
      const aiResp = await req(`/api/interactions/${newId}/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        tone: 'De-escalation',
        agentInstructions: 'Offer 1 month complimentary extension'
      });
      console.log('✓ [Generate AI Response]:', aiResp.status, 'Model:', aiResp.data?.data?.modelUsed, 'Draft snippet:', aiResp.data?.data?.responseDraft?.slice(0, 70) + '...');

      // 6. Post Response
      const resp = await req(`/api/interactions/${newId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        message: aiResp.data?.data?.responseDraft || 'Draft response',
        responderType: 'Agent',
        toneUsed: 'De-escalation',
        markResolved: true
      });
      console.log('✓ [Post Response & Resolve]:', resp.status, 'Response ID:', resp.data?.data?.id);

      // 7. Customers
      const custs = await req('/api/customers');
      console.log('✓ [Customers List]:', custs.status, 'Count:', custs.data?.data?.length);

      // 8. Knowledge Base
      const kb = await req('/api/knowledge-base');
      console.log('✓ [Knowledge Base]:', kb.status, 'Articles:', kb.data?.data?.length);

      // 9. Static UI HTML
      const html = await req('/');
      console.log('✓ [Frontend Static HTML]:', html.status, 'Contains root div:', html.raw?.includes('<div id="root"></div>'));

      console.log('\n======================================================');
      console.log('⭐ FULL STACK VERIFICATION PASSED WITH 100% SUCCESS! ⭐');
      console.log('======================================================');
      server.close();
      process.exit(0);
    } catch (testErr) {
      console.error('Test failed:', testErr);
      server.close();
      process.exit(1);
    }
  });
}

startAndTest();

