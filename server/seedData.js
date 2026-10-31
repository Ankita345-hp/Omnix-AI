import { v4 as uuidv4 } from 'uuid';

export const SEED_USERS = [
  {
    id: "a1111111-1111-4111-8111-111111111111",
    name: "Sarah Lin",
    email: "sarah.lin@omnix-enterprise.com",
    role: "Admin",
    department: "Customer Experience Operations",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
  },
  {
    id: "b2222222-2222-4222-8222-222222222222",
    name: "Marcus Vance",
    email: "marcus.v@omnix-enterprise.com",
    role: "Manager",
    department: "Enterprise Triage & Escalations",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
  },
  {
    id: "c3333333-3333-4333-8333-333333333333",
    name: "Elena Rostova",
    email: "elena.r@omnix-enterprise.com",
    role: "Agent",
    department: "Mobile & Tier 1 Support",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  },
  {
    id: "d4444444-4444-4444-8444-444444444444",
    name: "David Kim",
    email: "david.kim@omnix-enterprise.com",
    role: "Agent",
    department: "Billing & Retention Specialist",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
  }
];

export const SEED_CUSTOMERS = [
  {
    id: "e5555555-5555-4555-8555-555555555555",
    name: "Alexander Hayes",
    email: "alexander.hayes@apexfintech.io",
    company: "Apex Global FinTech",
    tier: "Enterprise",
    lifetime_value: 48500.00,
    phone: "+1 (555) 234-8901",
    preferred_channel: "Mobile App"
  },
  {
    id: "f6666666-6666-4666-8666-666666666666",
    name: "Dr. Maya Patel",
    email: "mpatel@biovista-labs.com",
    company: "BioVista Diagnostics",
    tier: "Gold",
    lifetime_value: 24200.00,
    phone: "+1 (555) 876-5432",
    preferred_channel: "Email"
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    name: "Lucas Tremblay",
    email: "lucas@quantumcloud.ca",
    company: "Quantum Cloud Networks",
    tier: "Silver",
    lifetime_value: 12800.00,
    phone: "+1 (555) 345-6789",
    preferred_channel: "Web Chat"
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    name: "Samantha Wright",
    email: "swright@hypergrowth.co",
    company: "HyperGrowth Media Group",
    tier: "Enterprise",
    lifetime_value: 62000.00,
    phone: "+1 (555) 901-2345",
    preferred_channel: "Social"
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@solarenergycorp.com",
    company: "Solaria Grid Dynamics",
    tier: "Standard",
    lifetime_value: 4500.00,
    phone: "+1 (555) 432-1098",
    preferred_channel: "Voice"
  }
];

export const SEED_INTERACTIONS = [
  {
    id: "10101010-1010-4010-8010-101010101010",
    customer_id: "e5555555-5555-4555-8555-555555555555",
    assigned_agent_id: "c3333333-3333-4333-8333-333333333333",
    channel: "Mobile App",
    device_type: "Android App",
    subject: "Android App Repeated Payment Crash on Subscription Renewal",
    raw_message: "I've been trying to upgrade my enterprise tier subscription on the Android mobile app for 2 full days and keep getting constant payment gateway errors! The app freezes every time I tap 'Authorize Google Pay', and now our team dashboard is locked. Fix this immediately or we will cancel our annual contract!",
    status: "Escalated",
    priority: "Urgent",
    category: "Billing & Subscription",
    sentiment_score: -0.92,
    sentiment_label: "Critical Rage",
    churn_risk: "Critical",
    ai_summary: "Enterprise client Alexander Hayes experienced repeated Android checkout crashes during tier upgrade, locking team access. High churn risk threat to cancel $48.5k contract unless resolved with priority executive attention.",
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: "20202020-2020-4020-8020-202020202020",
    customer_id: "f6666666-6666-4666-8666-666666666666",
    assigned_agent_id: "b2222222-2222-4222-8222-222222222222",
    channel: "Email",
    device_type: "Desktop",
    subject: "SAML 2.0 Single Sign-On Authentication Sync Failure",
    raw_message: "Good morning team. We noticed our lab scientists are getting 'Error 403: Token Invalid' when logging in via Okta SAML since the 08:00 UTC maintenance window. Could your enterprise identity team investigate the cert fingerprint?",
    status: "In Progress",
    priority: "High",
    category: "Account Authentication",
    sentiment_score: -0.45,
    sentiment_label: "Frustrated",
    churn_risk: "Medium",
    ai_summary: "Dr. Maya Patel reports Okta SAML 2.0 authentication failure across BioVista researchers following recent maintenance. Needs identity engineering cert sync review.",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: "30303030-3030-4030-8030-303030303030",
    customer_id: "77777777-7777-4777-8777-777777777777",
    assigned_agent_id: "d4444444-4444-4444-8444-444444444444",
    channel: "Web Chat",
    device_type: "Desktop",
    subject: "Inquiry Regarding Webhook Rate Limits and Kafka Integration",
    raw_message: "Hi, we love the platform! Quick technical question: what is the concurrent outbound webhook throughput for Silver accounts? We are piping events into our Apache Kafka cluster and want to make sure we don't hit 429 throttling during peak traffic.",
    status: "Open",
    priority: "Low",
    category: "Feature Request",
    sentiment_score: 0.82,
    sentiment_label: "Highly Positive",
    churn_risk: "Low",
    ai_summary: "Silver tier customer Lucas Tremblay inquiring about webhook rate limits and Kafka event streaming capacities. Positive tone with expansion intent.",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: "40404040-4040-4040-8040-404040404040",
    customer_id: "88888888-8888-4888-8888-888888888888",
    assigned_agent_id: "a1111111-1111-4111-8111-111111111111",
    channel: "Social",
    device_type: "Mobile Web",
    subject: "Public Twitter Mention: Latency Spike on Analytics Export",
    raw_message: "@OmniX_AI our weekly media reporting batch job has been spinning on 'Generating CSV' for over 45 minutes on mobile web. Is there an active service outage on the analytics worker queue? Our clients are waiting for their campaign numbers.",
    status: "Open",
    priority: "High",
    category: "Service Outage",
    sentiment_score: -0.65,
    sentiment_label: "Negative",
    churn_risk: "High",
    ai_summary: "Public social alert by Samantha Wright regarding 45-minute delay in CSV export pipeline. Potential worker queue latency spike affecting Enterprise reporting.",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 50).toISOString()
  },
  {
    id: "50505050-5050-4050-8050-505050505050",
    customer_id: "99999999-9999-4999-8999-999999999999",
    assigned_agent_id: "c3333333-3333-4333-8333-333333333333",
    channel: "Voice",
    device_type: "Android App",
    subject: "Voice Transcript: Android Biometric Fingerprint Login Setup",
    raw_message: "[VOICE CALL TRANSCRIPT - Inbound Support] Customer Carlos: 'Hello, I'm calling because after downloading the latest Android build on my Samsung Galaxy S24, biometric fingerprint login stopped triggering. I have to enter my master password manually every time I open the field inspection app. Is there a toggle I missed in permissions?'",
    status: "Resolved",
    priority: "Medium",
    category: "Mobile App Usability",
    sentiment_score: 0.15,
    sentiment_label: "Neutral",
    churn_risk: "Low",
    ai_summary: "Carlos Mendoza called regarding Android biometric authentication toggle failure on Samsung Galaxy S24. Resolved by clearing device biometric cache and re-granting hardware keystore permissions.",
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 150).toISOString()
  }
];

export const SEED_RESPONSES = [
  {
    id: "a0010010-0010-4010-8010-001000100010",
    interaction_id: "10101010-1010-4010-8010-101010101010",
    sender_id: null,
    responder_type: "Customer",
    message: "I've been trying to upgrade my enterprise tier subscription on the Android mobile app for 2 full days and keep getting constant payment gateway errors! The app freezes every time I tap 'Authorize Google Pay', and now our team dashboard is locked. Fix this immediately or we will cancel our annual contract!",
    tone_used: null,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: "a0020020-0020-4020-8020-002000200020",
    interaction_id: "10101010-1010-4010-8010-101010101010",
    sender_id: "c3333333-3333-4333-8333-333333333333",
    responder_type: "Agent",
    message: "Alexander, I sincerely apologize for the frustration and disruption this has caused your team. I have temporarily lifted all lockouts on your Apex FinTech enterprise dashboard so your team can work uninterrupted right now while our mobile payments engineer hotfixes the Google Pay Android intent handler.",
    tone_used: "De-escalation",
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  {
    id: "b0010010-0010-4010-8010-001000100010",
    interaction_id: "50505050-5050-4050-8050-505050505050",
    sender_id: null,
    responder_type: "Customer",
    message: "[Voice Call] Android biometric fingerprint login stopped triggering on Samsung Galaxy S24.",
    tone_used: null,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString()
  },
  {
    id: "b0020020-0020-4020-8020-002000200020",
    interaction_id: "50505050-5050-4050-8050-505050505050",
    sender_id: "c3333333-3333-4333-8333-333333333333",
    responder_type: "Agent",
    message: "Guided Carlos through Android App Settings > Biometric Authentication > Reset Keystore Binding. Carlos verified fingerprint login now functions instantly.",
    tone_used: "Consultative",
    created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString()
  }
];

export const SEED_KB_ARTICLES = [
  {
    id: "kb111111-1111-4111-8111-111111111111",
    title: "Troubleshooting Android In-App Billing & Google Pay Gateway Errors",
    content: "When users experience gateway timeouts or freezing on Android devices during tier renewals: 1. Verify Google Play Services version >= 24.12. 2. Clear app cache via Android Settings > Apps > OmniX > Storage > Clear Cache. 3. Check server-side Google Play Developer API token validity. 4. If locked, grant a 72-hour grace bypass flag in customer profile.",
    category: "Mobile & Billing",
    tags: ["Android", "Billing", "Google Pay", "Mobile App", "Checkout"],
    created_by: "a1111111-1111-4111-8111-111111111111",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
  },
  {
    id: "kb222222-2222-4222-8222-222222222222",
    title: "Okta & Azure AD SAML 2.0 Single Sign-On Certificate Renewal",
    content: "When SSO returns '403: Token Invalid' post-maintenance: 1. Confirm IdP X.509 signing certificate matches metadata XML in Admin Portal. 2. Check clock skew tolerance (default 180 seconds). 3. Ensure SHA-256 digest algorithm is selected. 4. Verify user principal name (UPN) matches customer corporate email domain.",
    category: "Authentication & Security",
    tags: ["SSO", "SAML", "Okta", "Azure AD", "Auth Error"],
    created_by: "b2222222-2222-4222-8222-222222222222",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
  },
  {
    id: "kb333333-3333-4333-8333-333333333333",
    title: "High-Throughput Webhook Architecture & Kafka Streaming Specifications",
    content: "OmniX provides dedicated Kafka topics for Silver, Gold, and Enterprise tiers. Silver accounts support up to 500 requests/sec with exponential backoff on HTTP 429. Enterprise accounts offer dedicated partition pipelines with sub-50ms p99 delivery latency.",
    category: "API & Integrations",
    tags: ["Webhooks", "Kafka", "Rate Limits", "Architecture", "Throughput"],
    created_by: "a1111111-1111-4111-8111-111111111111",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString()
  },
  {
    id: "kb444444-4444-4444-8444-444444444444",
    title: "Android Biometric Keystore Invalidation & Hardware Recovery",
    content: "Android 14+ introduces strict hardware keystore invalidation upon OS updates or biometric sensor reconfiguration. To re-bind, users must navigate to Security Settings in the OmniX mobile app and re-authenticate via primary credential once.",
    category: "Mobile & Security",
    tags: ["Android", "Biometrics", "Fingerprint", "Security", "Keystore"],
    created_by: "c3333333-3333-4333-8333-333333333333",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString()
  }
];

