export type ReflectionMode = 'reflection' | 'summary' | 'brainstorm' | 'chat';

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  placeId?: string;
}

export interface NotificationRule {
  enabled: boolean;
  channel: 'slack' | 'discord' | 'email';
  triggerOn: 'milestone' | 'goal' | 'critical_reflection' | 'all';
  destination?: string; // masked in UI
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface Interaction {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  messages: JournalMessage[];
  summary?: string;
  tags?: string[];
  location?: LocationData;
  notificationSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalInteractions: number;
  totalUsersEstimated: number;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    timestamp: string;
    resource: string;
    status: string;
  }>;
  systemStatus: {
    geminiService: string;
    firestoreService: string;
    notificationsQueue: string;
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface ReflectApiResponse {
  text: string;
  modelUsed: string;
  titleSuggestion?: string;
}

export interface AuthErrorDetail {
  code: string;
  title: string;
  message: string;
  isPopupBlocked: boolean;
  suggestion: string;
}

