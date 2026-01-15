export type CallStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'no_answer';

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  formattedPhoneNumber: string;
  createdAt: string;
}

export interface Call {
  id: string;
  contactId: string;
  contact: {
    id: string;
    name: string;
    phoneNumber: string;
    formattedPhoneNumber: string;
  };
  status: CallStatus;
  outcome: string | null;
  transcript: string | null;
  summary: string | null;
  structuredOutput: any | null;
  agentPrompt: string | null;
  callGoals: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ContactsListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}

export interface CallsListResponse {
  calls: Call[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateContactDto {
  name: string;
  phoneNumber: string;
}

export interface UpdateContactDto {
  name?: string;
  phoneNumber?: string;
}

export interface CreateCallDto {
  contactId: string;
  agentPrompt: string;
  callGoals: string;
}

export interface LaunchCallDto {
  customPrompt?: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface SignInResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
