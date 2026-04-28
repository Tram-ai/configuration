export type ChannelScope = "user" | "workspace";

export interface ChannelFieldOption {
  label: string;
  value: string;
}

export interface ChannelFieldSchema {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  default?: unknown;
  secret?: boolean;
  notes?: string[];
  options?: Array<string | ChannelFieldOption>;
}

export interface WorkspaceFolderSummary {
  name: string;
  path: string;
}

export interface ChannelScopeOption {
  id: ChannelScope;
  label: string;
  writable: boolean;
}

export interface ChannelTypeDefinition {
  type: string;
  displayName: string;
  source: string;
  requiredFields: string[];
  fields: ChannelFieldSchema[];
  notes: string[];
}

export interface ChannelValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ChannelRecord {
  name: string;
  type: string;
  displayName: string;
  source: string;
  config: Record<string, unknown>;
  normalizedConfig: Record<string, unknown>;
  validation: ChannelValidationResult;
  notes: string[];
}

export interface ChannelMetadataResponse {
  workspaceFolders: WorkspaceFolderSummary[];
  workspaceSelectionRequired: boolean;
  resolvedWorkspacePath?: string;
  isWorkspaceTrusted: boolean;
  scopes: ChannelScopeOption[];
  commonFields: ChannelFieldSchema[];
  channelTypes: ChannelTypeDefinition[];
}

export interface ChannelListResponse {
  scope: ChannelScope;
  workspacePath?: string;
  settingsPath?: string;
  isWorkspaceTrusted: boolean;
  workspaceSelectionRequired: boolean;
  channels: ChannelRecord[];
}

export interface ChannelMutationResponse {
  scope: ChannelScope;
  workspacePath?: string;
  settingsPath?: string;
  isWorkspaceTrusted: boolean;
  workspaceSelectionRequired: boolean;
  channel: ChannelRecord;
}

export interface ChannelDeleteResponse {
  scope: ChannelScope;
  workspacePath?: string;
  settingsPath?: string;
  isWorkspaceTrusted: boolean;
  workspaceSelectionRequired: boolean;
  deleted: boolean;
  name: string;
}

export const EMPTY_CHANNEL_METADATA: ChannelMetadataResponse = {
  workspaceFolders: [],
  workspaceSelectionRequired: false,
  resolvedWorkspacePath: "",
  isWorkspaceTrusted: false,
  scopes: [
    {
      id: "user",
      label: "User",
      writable: true,
    },
    {
      id: "workspace",
      label: "Workspace",
      writable: true,
    },
  ],
  commonFields: [],
  channelTypes: [],
};

export const EMPTY_CHANNEL_LIST: ChannelListResponse = {
  scope: "user",
  workspacePath: "",
  settingsPath: "",
  isWorkspaceTrusted: false,
  workspaceSelectionRequired: false,
  channels: [],
};