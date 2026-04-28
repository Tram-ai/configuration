import type {
  ChannelFieldSchema,
  ChannelDeleteResponse,
  ChannelListResponse,
  ChannelMetadataResponse,
  ChannelMutationResponse,
  ChannelRecord,
  ChannelScope,
} from "@/lib/channel-types";

export interface ChannelBridgeParams {
  port: string | null;
  authToken: string | null;
  scope: ChannelScope;
  workspacePath: string | null;
}

interface LocalChannelFieldOption {
  label: string;
  value: string;
}

interface LocalChannelField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  secret?: boolean;
  description?: string;
  options?: LocalChannelFieldOption[];
}

interface LocalChannelType {
  type: string;
  displayName: string;
  fields: LocalChannelField[];
}

interface LocalChannelMetadataResponse {
  channelName: string;
  selectedType?: string;
  commonFields?: LocalChannelField[];
  channelTypes?: LocalChannelType[];
  current?: {
    exists: boolean;
    config?: Record<string, unknown>;
    validationErrors?: string[];
  };
}

export class ChannelApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ChannelApiError";
    this.status = status;
    this.details = details;
  }
}

export function readChannelBridgeParams(search: string): ChannelBridgeParams {
  const params = new URLSearchParams(search);
  const scope = params.get("scope") === "workspace" ? "workspace" : "user";

  return {
    port: params.get("port"),
    authToken: params.get("authToken") ?? params.get("token"),
    scope,
    workspacePath: params.get("workspacePath"),
  };
}

function buildLocalApiBase(port: string) {
  return `http://localhost:${port}`;
}

async function parseApiPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function buildRequestUrl(port: string | null | undefined, path: string) {
  if (port && port.trim()) {
    return `${buildLocalApiBase(port.trim())}${path}`;
  }

  return path;
}

async function requestChannelApi<T>(
  port: string | null | undefined,
  authToken: string | null | undefined,
  path: string,
  init?: RequestInit,
) {
  const authHeader = authToken && authToken.trim() ? { Authorization: `Bearer ${authToken.trim()}` } : {};

  const response = await fetch(buildRequestUrl(port, path), {
    ...init,
    headers: {
      ...authHeader,
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseApiPayload(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : typeof payload === "string" && payload.trim()
          ? payload
          : `HTTP ${response.status}`;

    throw new ChannelApiError(message, response.status, payload);
  }

  return payload as T;
}

function mapFieldType(type: string) {
  if (type === "json") {
    return "object";
  }

  if (type === "string-array") {
    return "array";
  }

  return type;
}

function mapField(field: LocalChannelField): ChannelFieldSchema {
  return {
    key: field.key,
    label: field.label,
    type: mapFieldType(field.type),
    required: field.required,
    default: field.defaultValue,
    secret: field.secret,
    notes: field.description ? [field.description] : [],
    options: field.options,
  };
}

function buildChannelRecord(metadata: LocalChannelMetadataResponse, nameOverride?: string): ChannelRecord {
  const config = metadata.current?.config ?? {};
  const type =
    metadata.selectedType ??
    (typeof config.type === "string" ? config.type : "") ??
    metadata.channelTypes?.[0]?.type ??
    "";
  const name = nameOverride ?? metadata.channelName;
  const validationErrors = metadata.current?.validationErrors ?? [];

  return {
    name,
    type,
    displayName: metadata.channelTypes?.find((item) => item.type === type)?.displayName ?? type,
    source: "local",
    config,
    normalizedConfig: config,
    validation: {
      valid: validationErrors.length === 0,
      errors: validationErrors,
    },
    notes: [],
  };
}

function mapMetadata(metadata: LocalChannelMetadataResponse, workspacePath?: string): ChannelMetadataResponse {
  const channelTypes = (metadata.channelTypes ?? []).map((item) => ({
    type: item.type,
    displayName: item.displayName,
    source: "local",
    requiredFields: item.fields.filter((field) => field.required).map((field) => field.key),
    fields: item.fields.map(mapField),
    notes: [],
  }));

  return {
    workspaceFolders: [],
    workspaceSelectionRequired: false,
    resolvedWorkspacePath: workspacePath,
    isWorkspaceTrusted: true,
    scopes: [
      { id: "user", label: "User", writable: true },
      { id: "workspace", label: "Workspace", writable: true },
    ],
    commonFields: (metadata.commonFields ?? []).map(mapField),
    channelTypes,
  };
}

export async function fetchChannelMetadata(
  port: string | null | undefined,
  authToken: string | null | undefined,
  workspacePath?: string,
) {
  const payload = await requestChannelApi<LocalChannelMetadataResponse>(
    port,
    authToken,
    "/api/metadata",
  );

  return mapMetadata(payload, workspacePath);
}

export async function fetchChannels(
  port: string | null | undefined,
  authToken: string | null | undefined,
  scope: ChannelScope,
  workspacePath?: string,
) {
  const payload = await requestChannelApi<LocalChannelMetadataResponse>(
    port,
    authToken,
    "/api/metadata",
  );

  const channel = buildChannelRecord(payload);
  const channels = payload.current?.exists === false ? [] : [channel];

  return {
    scope,
    workspacePath,
    settingsPath: "",
    isWorkspaceTrusted: true,
    workspaceSelectionRequired: false,
    channels,
  } satisfies ChannelListResponse;
}

export async function fetchChannel(
  port: string | null | undefined,
  authToken: string | null | undefined,
  name: string,
  _scope: ChannelScope,
  _workspacePath?: string,
) {
  const payload = await requestChannelApi<LocalChannelMetadataResponse>(
    port,
    authToken,
    "/api/metadata",
  );

  return buildChannelRecord(payload, name);
}

export async function upsertChannel(
  port: string | null | undefined,
  authToken: string | null | undefined,
  name: string,
  scope: ChannelScope,
  config: Record<string, unknown>,
  workspacePath?: string,
) {
  await requestChannelApi<unknown>(
    port,
    authToken,
    "/api/channel",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ config }),
    },
  );

  const metadata = await requestChannelApi<LocalChannelMetadataResponse>(
    port,
    authToken,
    "/api/metadata",
  );

  return {
    scope,
    workspacePath,
    settingsPath: "",
    isWorkspaceTrusted: true,
    workspaceSelectionRequired: false,
    channel: buildChannelRecord(metadata, name),
  } satisfies ChannelMutationResponse;
}

export async function deleteChannel(
  port: string | null | undefined,
  authToken: string | null | undefined,
  name: string,
  scope: ChannelScope,
  workspacePath?: string,
) {
  const payload = await requestChannelApi<Partial<ChannelDeleteResponse>>(
    port,
    authToken,
    "/api/channel",
    {
      method: "DELETE",
    },
  );

  return {
    scope,
    workspacePath,
    settingsPath: "",
    isWorkspaceTrusted: true,
    workspaceSelectionRequired: false,
    deleted: payload.deleted ?? true,
    name: payload.name ?? name,
  } satisfies ChannelDeleteResponse;
}