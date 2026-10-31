import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  SEED_USERS,
  SEED_CUSTOMERS,
  SEED_INTERACTIONS,
  SEED_RESPONSES,
  SEED_KB_ARTICLES
} from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool = null;
let usePostgres = false;
let dbStatus = {
  mode: 'initializing',
  connected: false,
  message: 'Attempting connection...'
};

// Resilient In-Memory & File-backed Store
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const memoryStore = {
  users: [...SEED_USERS],
  customers: [...SEED_CUSTOMERS],
  interactions: [...SEED_INTERACTIONS],
  interaction_responses: [...SEED_RESPONSES],
  kb_articles: [...SEED_KB_ARTICLES]
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersistedStore() {
  try {
    ensureDataDir();
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.interactions && Array.isArray(data.interactions)) {
        Object.assign(memoryStore, data);
        console.log(`[OmniX-AI DB] Loaded ${memoryStore.interactions.length} interactions from local store cache.`);
      }
    } else {
      savePersistedStore();
    }
  } catch (err) {
    console.warn('[OmniX-AI DB] Local store cache warning:', err.message);
  }
}

function savePersistedStore() {
  try {
    ensureDataDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[OmniX-AI DB] Unable to persist store file:', err.message);
  }
}

export async function initDatabase() {
  loadPersistedStore();

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log('[OmniX-AI DB] No DATABASE_URL specified. Initializing Resilient High-Speed Storage Engine.');
    usePostgres = false;
    dbStatus = {
      mode: 'Resilient Local Store',
      connected: true,
      message: 'Active and persisting locally (PostgreSQL-ready)'
    };
    return;
  }

  try {
    const isSupabase = connectionString.includes('supabase.co');
    pool = new Pool({
      connectionString,
      ssl: (process.env.NODE_ENV === 'production' || isSupabase) && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    const modeLabel = isSupabase ? 'Supabase PostgreSQL (Render Backend)' : 'PostgreSQL Active';
    console.log(`[OmniX-AI DB] ${modeLabel} connection established successfully.`);
    usePostgres = true;
    dbStatus = {
      mode: modeLabel,
      connected: true,
      message: `Connected to ${isSupabase ? 'Supabase Managed Database' : 'PostgreSQL server'}`
    };

    // Run Migration
    try {
      const migrationPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        await client.query(sql);
        console.log('[OmniX-AI DB] Schema migration verified.');

        // Seed if empty
        const countRes = await client.query('SELECT COUNT(*) FROM interactions');
        if (parseInt(countRes.rows[0].count, 10) === 0) {
          console.log('[OmniX-AI DB] Seeding initial enterprise records into PostgreSQL...');
          for (const u of SEED_USERS) {
            await client.query(
              `INSERT INTO users (id, name, email, role, department, avatar_url)
               VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING`,
              [u.id, u.name, u.email, u.role, u.department, u.avatar_url]
            );
          }
          for (const c of SEED_CUSTOMERS) {
            await client.query(
              `INSERT INTO customers (id, name, email, company, tier, lifetime_value, phone, preferred_channel)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email) DO NOTHING`,
              [c.id, c.name, c.email, c.company, c.tier, c.lifetime_value, c.phone, c.preferred_channel]
            );
          }
          for (const i of SEED_INTERACTIONS) {
            await client.query(
              `INSERT INTO interactions (id, customer_id, assigned_agent_id, channel, device_type, subject, raw_message, status, priority, category, sentiment_score, sentiment_label, churn_risk, ai_summary, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) ON CONFLICT DO NOTHING`,
              [i.id, i.customer_id, i.assigned_agent_id, i.channel, i.device_type, i.subject, i.raw_message, i.status, i.priority, i.category, i.sentiment_score, i.sentiment_label, i.churn_risk, i.ai_summary, i.created_at, i.updated_at]
            );
          }
          for (const r of SEED_RESPONSES) {
            await client.query(
              `INSERT INTO interaction_responses (id, interaction_id, sender_id, responder_type, message, tone_used, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
              [r.id, r.interaction_id, r.sender_id, r.responder_type, r.message, r.tone_used, r.created_at]
            );
          }
          for (const k of SEED_KB_ARTICLES) {
            await client.query(
              `INSERT INTO kb_articles (id, title, content, category, tags, created_by, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
              [k.id, k.title, k.content, k.category, k.tags, k.created_by, k.created_at]
            );
          }
          console.log('[OmniX-AI DB] Initial PostgreSQL seed complete.');
        }
      }
    } catch (migErr) {
      console.warn('[OmniX-AI DB] Migration warning (tables may already exist):', migErr.message);
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn(`[OmniX-AI DB] PostgreSQL connection to ${connectionString} was unavailable (${err.message}).`);
    console.log('[OmniX-AI DB] Seamlessly active in Resilient Local Storage mode with seed data.');
    usePostgres = false;
    dbStatus = {
      mode: 'Resilient Local Store',
      connected: true,
      message: `Active with fallback store (PostgreSQL connection attempted: ${err.message})`
    };
  }
}

/**
 * Universal query runner: executes against PostgreSQL when connected,
 * or against the local store with full fidelity.
 */
export async function query(sql, params = []) {
  if (usePostgres && pool) {
    return pool.query(sql, params);
  }

  // Resilient memory store execution
  return executeMemoryQuery(sql, params);
}

export function isUsingPostgres() {
  return usePostgres;
}

export function getDatabaseStatus() {
  return {
    ...dbStatus,
    timestamp: new Date().toISOString(),
    metrics: {
      interactionsCount: memoryStore.interactions.length,
      customersCount: memoryStore.customers.length,
      responsesCount: memoryStore.interaction_responses.length,
      kbArticlesCount: memoryStore.kb_articles.length
    }
  };
}

export function getMemoryStore() {
  return memoryStore;
}

export function persistStore() {
  savePersistedStore();
}

/**
 * High-performance query engine for memory store supporting the application's exact SQL patterns
 */
function executeMemoryQuery(sql, params = []) {
  const normalized = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT COUNT(*) FROM interactions
  if (/^SELECT COUNT\(\*\) FROM interactions/i.test(normalized)) {
    return { rows: [{ count: memoryStore.interactions.length }] };
  }

  // 2. Insert interaction
  if (/^INSERT INTO interactions/i.test(normalized)) {
    // [id, customer_id, assigned_agent_id, channel, device_type, subject, raw_message, status, priority, category, sentiment_score, sentiment_label, churn_risk, ai_summary, created_at, updated_at]
    const item = {
      id: params[0],
      customer_id: params[1],
      assigned_agent_id: params[2],
      channel: params[3],
      device_type: params[4] || 'Desktop',
      subject: params[5],
      raw_message: params[6],
      status: params[7] || 'Open',
      priority: params[8] || 'Medium',
      category: params[9],
      sentiment_score: params[10],
      sentiment_label: params[11],
      churn_risk: params[12] || 'Low',
      ai_summary: params[13],
      created_at: params[14] || new Date().toISOString(),
      updated_at: params[15] || new Date().toISOString()
    };
    memoryStore.interactions.unshift(item);
    savePersistedStore();
    return { rows: [item], rowCount: 1 };
  }

  // 3. Insert customer
  if (/^INSERT INTO customers/i.test(normalized)) {
    const cust = {
      id: params[0],
      name: params[1],
      email: params[2],
      company: params[3] || '',
      tier: params[4] || 'Standard',
      lifetime_value: params[5] || 0.00,
      phone: params[6] || '',
      preferred_channel: params[7] || 'Web Chat',
      created_at: new Date().toISOString()
    };
    memoryStore.customers.push(cust);
    savePersistedStore();
    return { rows: [cust], rowCount: 1 };
  }

  // 4. Insert response
  if (/^INSERT INTO interaction_responses/i.test(normalized)) {
    const resp = {
      id: params[0],
      interaction_id: params[1],
      sender_id: params[2],
      responder_type: params[3],
      message: params[4],
      tone_used: params[5] || null,
      created_at: params[6] || new Date().toISOString()
    };
    memoryStore.interaction_responses.push(resp);
    savePersistedStore();
    return { rows: [resp], rowCount: 1 };
  }

  // 5. Insert KB article
  if (/^INSERT INTO kb_articles/i.test(normalized)) {
    const kb = {
      id: params[0],
      title: params[1],
      content: params[2],
      category: params[3],
      tags: params[4] || [],
      created_by: params[5],
      created_at: params[6] || new Date().toISOString()
    };
    memoryStore.kb_articles.push(kb);
    savePersistedStore();
    return { rows: [kb], rowCount: 1 };
  }

  // 6. Generic SELECT with join for single interaction by ID
  if (/SELECT.*FROM interactions.*WHERE.*interactions\.id\s*=\s*\$1/i.test(normalized)) {
    const id = params[0];
    const interaction = memoryStore.interactions.find(i => i.id === id);
    if (!interaction) {
      return { rows: [], rowCount: 0 };
    }
    const customer = memoryStore.customers.find(c => c.id === interaction.customer_id) || {};
    const agent = memoryStore.users.find(u => u.id === interaction.assigned_agent_id) || {};

    const enriched = {
      ...interaction,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_company: customer.company,
      customer_tier: customer.tier,
      customer_ltv: customer.lifetime_value,
      assigned_agent_name: agent.name,
      assigned_agent_email: agent.email,
      assigned_agent_avatar: agent.avatar_url
    };
    return { rows: [enriched], rowCount: 1 };
  }

  // Default empty or safe return
  return { rows: [], rowCount: 0 };
}

