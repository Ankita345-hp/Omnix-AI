import {
  DashboardMetrics,
  Interaction,
  InteractionResponse,
  CustomerSummary,
  CustomerJourneyDetail,
  KbArticle,
  SystemSettings,
  ToneType
} from '../types';

// Resolve API Base URL:
// In Vercel production: points to VITE_API_URL (e.g., https://omnix-ai-backend.onrender.com)
// In local dev with Vite proxy: defaults to '/api'
const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/$/, '')}/api` : '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data?.error || (data?.details ? data.details.map((d: any) => d.message).join(', ') : 'An unexpected error occurred');
    throw new Error(errorMsg);
  }
  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<any>(res);
  },

  // Dashboard Metrics
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const res = await fetch(`${API_BASE}/dashboard/metrics`);
    return handleResponse<DashboardMetrics>(res);
  },

  // Interactions
  getInteractions: async (params: {
    status?: string;
    priority?: string;
    channel?: string;
    deviceType?: string;
    sentiment?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: Interaction[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.channel) query.append('channel', params.channel);
    if (params.deviceType) query.append('deviceType', params.deviceType);
    if (params.sentiment) query.append('sentiment', params.sentiment);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/interactions?${query.toString()}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch interactions');
    return {
      data: json.data,
      pagination: json.pagination
    };
  },

  getInteraction: async (id: string): Promise<{ interaction: Interaction; responses: InteractionResponse[] }> => {
    const res = await fetch(`${API_BASE}/interactions/${id}`);
    return handleResponse<{ interaction: Interaction; responses: InteractionResponse[] }>(res);
  },

  createInteraction: async (payload: {
    customerName: string;
    customerEmail: string;
    channel: string;
    deviceType: string;
    rawMessage: string;
    company?: string;
    tier?: string;
  }): Promise<Interaction> => {
    const res = await fetch(`${API_BASE}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<Interaction>(res);
  },

  updateInteraction: async (id: string, payload: {
    status?: string;
    priority?: string;
    assignedAgentId?: string | null;
  }): Promise<Interaction> => {
    const res = await fetch(`${API_BASE}/interactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<Interaction>(res);
  },

  reanalyzeInteraction: async (id: string): Promise<{ data: Interaction; analysis: any }> => {
    const res = await fetch(`${API_BASE}/interactions/${id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to analyze interaction');
    return json;
  },

  generateAiResponse: async (id: string, payload: {
    tone: ToneType;
    agentInstructions?: string;
  }): Promise<{ responseDraft: string; internalNotes: string; modelUsed: string; source: string }> => {
    const res = await fetch(`${API_BASE}/interactions/${id}/generate-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<{ responseDraft: string; internalNotes: string; modelUsed: string; source: string }>(res);
  },

  sendResponse: async (id: string, payload: {
    message: string;
    responderType?: 'Agent' | 'Customer' | 'AI_Draft';
    toneUsed?: string;
    senderId?: string | null;
    markResolved?: boolean;
  }): Promise<InteractionResponse> => {
    const res = await fetch(`${API_BASE}/interactions/${id}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<InteractionResponse>(res);
  },

  // Customer Journey
  getCustomers: async (): Promise<CustomerSummary[]> => {
    const res = await fetch(`${API_BASE}/customers`);
    return handleResponse<CustomerSummary[]>(res);
  },

  getCustomerJourney: async (customerId: string): Promise<CustomerJourneyDetail> => {
    const res = await fetch(`${API_BASE}/customers/${customerId}/journey`);
    return handleResponse<CustomerJourneyDetail>(res);
  },

  // Knowledge Base
  getKbArticles: async (query?: string, category?: string): Promise<KbArticle[]> => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (category) params.append('category', category);
    const res = await fetch(`${API_BASE}/knowledge-base?${params.toString()}`);
    return handleResponse<KbArticle[]>(res);
  },

  createKbArticle: async (payload: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
  }): Promise<KbArticle> => {
    const res = await fetch(`${API_BASE}/knowledge-base`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<KbArticle>(res);
  },

  // Settings
  getSettings: async (): Promise<SystemSettings> => {
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse<SystemSettings>(res);
  },

  updateSettings: async (payload: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse<any>(res);
  },

  testGeminiKey: async (apiKey: string): Promise<{ success: boolean; message: string; model: string; latencyMs: number }> => {
    const res = await fetch(`${API_BASE}/settings/test-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to verify key');
    return json;
  }
};

