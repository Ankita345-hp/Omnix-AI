export type ChannelType = 'Web Chat' | 'Mobile App' | 'Email' | 'Social' | 'Voice';
export type DeviceType = 'Desktop' | 'Android App' | 'iOS App' | 'Mobile Web';
export type StatusType = 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
export type PriorityType = 'Low' | 'Medium' | 'High' | 'Urgent';
export type SentimentLabelType = 'Highly Positive' | 'Positive' | 'Neutral' | 'Frustrated' | 'Negative' | 'Critical Rage';
export type ChurnRiskType = 'Low' | 'Medium' | 'High' | 'Critical';
export type TierType = 'Standard' | 'Silver' | 'Gold' | 'Enterprise';
export type ResponderType = 'Agent' | 'Customer' | 'AI_Draft';
export type ToneType = 'Empathetic' | 'Executive' | 'Consultative' | 'De-escalation';

export interface Interaction {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_company?: string;
  customer_tier?: TierType;
  customer_ltv?: number;
  customer_phone?: string;
  customer_pref_channel?: string;
  assigned_agent_id?: string | null;
  assigned_agent_name?: string | null;
  assigned_agent_email?: string | null;
  assigned_agent_avatar?: string | null;
  assigned_agent_dept?: string | null;
  channel: ChannelType;
  device_type: DeviceType;
  subject: string;
  raw_message: string;
  status: StatusType;
  priority: PriorityType;
  category: string;
  sentiment_score: number | string;
  sentiment_label: SentimentLabelType;
  churn_risk: ChurnRiskType;
  ai_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface InteractionResponse {
  id: string;
  interaction_id: string;
  sender_id?: string | null;
  sender_name?: string;
  sender_avatar?: string | null;
  responder_type: ResponderType;
  message: string;
  tone_used?: string | null;
  created_at: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  company?: string;
  tier: TierType;
  lifetimeValue: number;
  preferredChannel: string;
  totalTouchpoints: number;
  channelsUsed: string[];
  overallChurnRisk: ChurnRiskType;
  latestSubject: string;
  latestSentiment: SentimentLabelType;
  lastActive: string;
}

export interface CustomerJourneyDetail {
  customer: {
    id: string;
    name: string;
    email: string;
    company?: string;
    tier: TierType;
    lifetimeValue: number;
    phone?: string;
    preferredChannel: string;
  };
  currentStage: string;
  totalTouchpoints: number;
  channelDistribution: { channel: string; count: number }[];
  sentimentTrajectory: { date: string; score: number; label: string; channel: string }[];
  timeline: Interaction[];
}

export interface DashboardMetrics {
  summary: {
    totalInteractions: number;
    csatPercentage: number;
    openEscalations: number;
    highRiskChurnCount: number;
    resolvedCount: number;
    resolutionRate: number;
    avgResponseTimeMinutes: number;
  };
  channelBreakdown: { name: string; count: number; percentage: number }[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  sentimentBreakdown: { label: string; count: number; color: string }[];
  churnDistribution: { risk: string; count: number }[];
  csatTrends: { day: string; csat: number; nps: number; volume: number; androidTraffic: number }[];
  recentHighRiskAlerts: {
    id: string;
    subject: string;
    channel: ChannelType;
    deviceType: DeviceType;
    churnRisk: ChurnRiskType;
    sentimentLabel: SentimentLabelType;
    status: StatusType;
    createdAt: string;
  }[];
}

export interface KbArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author_name?: string;
  created_at: string;
}

export interface SystemSettings {
  ai: {
    hasApiKey: boolean;
    maskedApiKey: string;
    modelName: string;
    proModelName: string;
    temperature: number;
    autoPersonalization: boolean;
    availableModels: { id: string; name: string; latency: string; optimalFor: string }[];
  };
  triageRules: {
    criticalChurnAutoEscalate: boolean;
    androidLatencyAlertThresholdMs: number;
    vipThresholdLtv: number;
  };
  database: {
    mode: string;
    connected: boolean;
    message: string;
    timestamp: string;
    metrics?: {
      interactionsCount: number;
      customersCount: number;
      responsesCount: number;
      kbArticlesCount: number;
    };
  };
  supabase?: {
    configured: boolean;
    url: string;
    hasAnonKey: boolean;
    hasServiceRoleKey: boolean;
    health?: any;
  };
  render?: {
    serviceUrl: string;
    environment: string;
  };
  team: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    avatar_url?: string;
  }[];
  systemTime: string;
}

