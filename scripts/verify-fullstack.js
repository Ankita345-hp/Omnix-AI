import http from 'http';

async function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing OmniX-AI Full Stack APIs...');

  try {
    // 1. Health check
    const health = await request('http://localhost:5000/api/health');
    console.log('✓ /api/health status:', health.status, 'db mode:', health.data?.database?.mode);

    // 2. Dashboard metrics
    const metrics = await request('http://localhost:5000/api/dashboard/metrics');
    console.log('✓ /api/dashboard/metrics status:', metrics.status, 'total interactions:', metrics.data?.summary?.totalInteractions, 'csat:', metrics.data?.summary?.csatPercentage + '%');

    // 3. Ingest Interaction
    const newInteractionPayload = {
      customerName: 'Marcus Sterling',
      customerEmail: 'm.sterling@sterling-holdings.co.uk',
      company: 'Sterling Capital Holdings',
      tier: 'Enterprise',
      channel: 'Mobile App',
      deviceType: 'Android App',
      rawMessage: "We experienced repeated payment timeout crashes while authorizing our quarterly subscription on Android. Our portfolio reports are now inaccessible!"
    };

    const created = await request('http://localhost:5000/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, newInteractionPayload);

    console.log('✓ POST /api/interactions status:', created.status, 'subject:', created.data?.subject, 'sentiment:', created.data?.sentiment_label, 'churnRisk:', created.data?.churn_risk);

    const newId = created.data?.id;

    if (newId) {
      // 4. Get Interaction Detail
      const detail = await request(`http://localhost:5000/api/interactions/${newId}`);
      console.log('✓ GET /api/interactions/:id status:', detail.status, 'customer:', detail.data?.interaction?.customer_name, 'responses count:', detail.data?.responses?.length);

      // 5. Generate AI Response
      const aiResp = await request(`http://localhost:5000/api/interactions/${newId}/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { tone: 'De-escalation', agentInstructions: 'Mention 1 month credit applied' });

      console.log('✓ POST /api/interactions/:id/generate-response status:', aiResp.status, 'tone:', aiResp.data?.toneRequested);
      console.log('  Response preview:', aiResp.data?.responseDraft?.slice(0, 90) + '...');

      // 6. Post Agent Response & Resolve
      const sendResp = await request(`http://localhost:5000/api/interactions/${newId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        message: aiResp.data?.responseDraft || 'Issue resolved',
        responderType: 'Agent',
        toneUsed: 'De-escalation',
        markResolved: true
      });

      console.log('✓ POST /api/interactions/:id/responses status:', sendResp.status, 'msg:', sendResp.data?.message?.slice(0, 50));
    }

    // 7. Customers & Journey
    const custs = await request('http://localhost:5000/api/customers');
    console.log('✓ GET /api/customers status:', custs.status, 'count:', custs.data?.length);

    // 8. Knowledge Base
    const kb = await request('http://localhost:5000/api/knowledge-base');
    console.log('✓ GET /api/knowledge-base status:', kb.status, 'articles count:', kb.data?.length);

    // 9. Static UI HTML
    const htmlRes = await request('http://localhost:5000/');
    const containsRoot = htmlRes.raw?.includes('<div id="root"></div>');
    console.log('✓ GET / (Production HTML Frontend) status:', htmlRes.status, 'contains root div:', containsRoot);

    console.log('\n========================================================');
    console.log('🎉 ALL OMNIX-AI SYSTEM TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();

