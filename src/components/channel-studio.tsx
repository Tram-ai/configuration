"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useUiAppearance } from "@/lib/use-ui-appearance";
import { ChevronDown, ChevronUp, Loader2, Moon, QrCode, RefreshCw, Save, Sun, Terminal, Trash2 } from "lucide-react";

type MessageType = "info" | "success" | "error";
type FieldKind = "string" | "secret" | "number" | "json" | "string-array" | "enum";

interface ApiErrorBody {
  error?: string;
}

interface ChannelFieldOption {
  label: string;
  value: string;
}

interface ChannelField {
  key: string;
  label: string;
  type: FieldKind | string;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
  options?: ChannelFieldOption[];
}

interface ChannelType {
  type: string;
  displayName: string;
  supportsQrBinding?: boolean;
  fields: ChannelField[];
}

interface WeixinAccount {
  configured: boolean;
  baseUrl?: string;
  userId?: string;
  savedAt?: string;
}

interface MetadataResponse {
  channelName: string;
  selectedType?: string;
  commonFields?: ChannelField[];
  channelTypes?: ChannelType[];
  current?: {
    exists: boolean;
    config?: Record<string, unknown>;
    validationErrors?: string[];
  };
  weixinAccount?: WeixinAccount;
}

interface WeixinBinding {
  bindingId: string;
  status: "pending" | "connected" | "failed";
  message: string;
  error?: string;
  qrCodeUrl?: string;
  userId?: string;
}

interface BridgeConfig {
  baseUrl: string;
  authToken: string;
  initialChannelName: string;
}

function getPortFromSearch(search: string) {
  const params = new URLSearchParams(search);
  return (params.get("port") ?? params.get("PORT") ?? "").trim();
}

function toBridgeConfig(): BridgeConfig {
  if (typeof window === "undefined") {
    return { baseUrl: "", authToken: "", initialChannelName: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const port = getPortFromSearch(window.location.search);
  const authToken = (params.get("authToken") ?? params.get("token") ?? "").trim();
  const initialChannelName = (params.get("channelName") ?? "").trim();

  return {
    baseUrl: port ? `http://localhost:${port}` : "",
    authToken,
    initialChannelName,
  };
}

function dedupeFields(fields: ChannelField[]) {
  const seen = new Set<string>();
  return fields.filter((field) => {
    if (seen.has(field.key)) {
      return false;
    }
    seen.add(field.key);
    return true;
  });
}

function displayValue(field: ChannelField, value: unknown) {
  let nextValue = value;
  if (nextValue === undefined || nextValue === null) {
    nextValue = field.defaultValue;
  }

  if (nextValue === undefined || nextValue === null) {
    return "";
  }

  if (field.type === "json") {
    return JSON.stringify(nextValue, null, 2);
  }

  if (field.type === "string-array") {
    return Array.isArray(nextValue) ? nextValue.join("\n") : "";
  }

  return String(nextValue);
}

function parseDraftValue(field: ChannelField, rawValue: string) {
  const text = rawValue ?? "";

  if (field.type === "number") {
    if (!text.trim()) {
      return undefined;
    }
    const value = Number(text);
    if (!Number.isFinite(value)) {
      throw new Error(`${field.label} 必须是数字`);
    }
    return value;
  }

  if (field.type === "json") {
    if (!text.trim()) {
      return field.defaultValue === undefined ? undefined : field.defaultValue;
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${field.label} 必须是合法 JSON`);
    }
  }

  if (field.type === "string-array") {
    if (!text.trim()) {
      return [];
    }
    return text
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const trimmed = text.trim();
  return trimmed ? trimmed : undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "请求失败";
}

function normalizeFieldToken(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[\s_-]/g, "");
}

function isSenderStrategyField(field: ChannelField) {
  const key = normalizeFieldToken(field.key);
  const label = normalizeFieldToken(field.label);

  return key.includes("senderstrategy") || label.includes("发送者策略") || label.includes("senderstrategy");
}

function getPairedSenderStrategyValue(field: ChannelField) {
  return field.options?.find((option) => {
    const value = normalizeFieldToken(option.value);
    const label = normalizeFieldToken(option.label);

    return value === "paired" || value === "pair" || value.includes("pair") || label.includes("配对") || label.includes("paired") || label.includes("pair");
  })?.value;
}

function applyDefaultDraftValues(fields: ChannelField[], draft: Record<string, string>) {
  const senderStrategyField = fields.find((field) => isSenderStrategyField(field));
  if (!senderStrategyField) {
    return draft;
  }

  const currentValue = (draft[senderStrategyField.key] ?? "").trim();
  if (currentValue) {
    return draft;
  }

  const pairedValue = getPairedSenderStrategyValue(senderStrategyField);
  if (!pairedValue) {
    return draft;
  }

  return {
    ...draft,
    [senderStrategyField.key]: pairedValue,
  };
}

export function ChannelStudio() {
  const { appearance, setAppearance } = useUiAppearance();
  const [bridge, setBridge] = useState<BridgeConfig>({
    baseUrl: "",
    authToken: "",
    initialChannelName: "",
  });
  const [bridgeReady, setBridgeReady] = useState(false);
  const [channelName, setChannelName] = useState("");

  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const draftRef = useRef<Record<string, string>>({});
  const channelNameRef = useRef("");
  const [selectedType, setSelectedType] = useState("");
  const [binding, setBinding] = useState<WeixinBinding | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const nextBridge = toBridgeConfig();
    setBridge(nextBridge);
    setChannelName(nextBridge.initialChannelName);
    setBridgeReady(true);
  }, []);

  const getTypeDef = useCallback(
    (type: string) => metadata?.channelTypes?.find((item) => item.type === type) ?? null,
    [metadata],
  );

  const currentFields = useMemo(() => {
    if (!metadata) {
      return [] as ChannelField[];
    }

    const typeDef = getTypeDef(selectedType || metadata.selectedType || "");
    return dedupeFields([...(metadata.commonFields ?? []), ...(typeDef?.fields ?? [])]).filter(
      (field) => field.key !== "type",
    );
  }, [getTypeDef, metadata, selectedType]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    channelNameRef.current = channelName;
  }, [channelName]);

  useEffect(() => {
    setDraft((prev) => {
      const nextDraft = applyDefaultDraftValues(currentFields, prev);
      return nextDraft === prev ? prev : nextDraft;
    });
  }, [currentFields]);

  const effectiveChannelName = channelName.trim() || metadata?.channelName?.trim() || "";

  const initializeDraft = useCallback(
    (nextMetadata: MetadataResponse, preserveExisting: boolean) => {
      const nextDraft = preserveExisting ? { ...draftRef.current } : {};
      const currentConfig = nextMetadata.current?.config ?? {};
      const fallbackType =
        nextMetadata.selectedType ??
        (typeof currentConfig.type === "string" ? currentConfig.type : "") ??
        nextMetadata.channelTypes?.[0]?.type ??
        "";

      nextDraft.type = String(nextDraft.type ?? fallbackType);
      const typeDef = nextMetadata.channelTypes?.find((item) => item.type === nextDraft.type) ?? null;
      const fields = dedupeFields([...(nextMetadata.commonFields ?? []), ...(typeDef?.fields ?? [])]);

      for (const field of fields) {
        if (!preserveExisting || nextDraft[field.key] === undefined) {
          nextDraft[field.key] = displayValue(field, currentConfig[field.key]);
        }
      }

      const hydratedDraft = applyDefaultDraftValues(fields, nextDraft);

      setSelectedType(hydratedDraft.type || fallbackType);
      setDraft(hydratedDraft);
    },
    [],
  );

  const api = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const response = await fetch(`${bridge.baseUrl}${path}`, {
        ...init,
        headers: {
          ...(bridge.authToken ? { Authorization: `Bearer ${bridge.authToken}` } : {}),
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const apiBody = payload as ApiErrorBody | null;
        throw new Error(apiBody?.error || `HTTP ${response.status}`);
      }

      return payload as T;
    },
    [bridge.authToken, bridge.baseUrl],
  );

  const loadMetadata = useCallback(
    async (preserveDraft: boolean, requestedChannelName = channelNameRef.current) => {
      setLoading(true);
      setError("");
      try {
        const trimmedChannelName = requestedChannelName.trim();
        const params = new URLSearchParams();
        if (trimmedChannelName) {
          params.set("channelName", trimmedChannelName);
        }
        const query = params.toString();
        const nextMetadata = await api<MetadataResponse>(
          query ? `/api/metadata?${query}` : "/api/metadata",
        );
        setMetadata(nextMetadata);
        setChannelName(trimmedChannelName || nextMetadata.channelName || "");
        initializeDraft(nextMetadata, preserveDraft);
        if (!preserveDraft) {
          setMessage("");
        }
      } catch (nextError) {
        setError(getErrorMessage(nextError));
      } finally {
        setLoading(false);
      }
    },
    [api, initializeDraft],
  );

  const buildPayload = useCallback(() => {
    const config: Record<string, unknown> = {};
    const nextType = (selectedType || metadata?.selectedType || draft.type || "").trim();

    if (nextType) {
      config.type = nextType;
    }

    for (const field of currentFields) {
      const rawValue = draft[field.key] ?? "";
      const parsed = parseDraftValue(field, rawValue);
      if (parsed !== undefined) {
        config[field.key] = parsed;
      }
    }

    return config;
  }, [currentFields, draft, metadata?.selectedType, selectedType]);

  const saveChannel = useCallback(async () => {
    const trimmedChannelName = channelNameRef.current.trim();
    if (!trimmedChannelName) {
      setError("请先填写 Channel Name");
      setMessage("");
      setMessageType("error");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("保存中...");
    setMessageType("info");

    try {
      await api("/api/channel", {
        method: "PUT",
        body: JSON.stringify({
          channelName: trimmedChannelName,
          config: buildPayload(),
        }),
      });
      setMessage("保存成功，CLI 会在返回后关闭会话");
      setMessageType("success");
      await loadMetadata(true, trimmedChannelName);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }, [api, buildPayload, loadMetadata]);

  const deleteCurrentChannel = useCallback(async () => {
    const targetChannelName =
      channelNameRef.current.trim() || metadata?.channelName?.trim() || "";
    if (!targetChannelName) {
      setError("请先填写 Channel Name");
      setMessage("");
      setMessageType("error");
      return;
    }

    if (!window.confirm(`确认删除 channel ${targetChannelName} ?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("删除中...");
    setMessageType("info");

    try {
      await api("/api/channel", {
        method: "DELETE",
        body: JSON.stringify({
          channelName: targetChannelName,
        }),
      });
      setMessage("已删除，CLI 会在返回后关闭会话");
      setMessageType("success");
      await loadMetadata(false, targetChannelName);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }, [api, loadMetadata, metadata?.channelName]);

  const pollBinding = useCallback(
    async (bindingId: string) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      try {
        const nextBinding = await api<WeixinBinding>(`/api/weixin/bind?bindingId=${encodeURIComponent(bindingId)}`);
        setBinding(nextBinding);

        if (nextBinding.status === "pending") {
          timerRef.current = window.setTimeout(() => {
            void pollBinding(bindingId);
          }, 1500);
          return;
        }

        if (nextBinding.status === "connected") {
          setMessage("微信账号已成功绑定");
          setMessageType("success");
          await loadMetadata(true);
          return;
        }

        setError(nextBinding.error || nextBinding.message || "微信绑定失败");
      } catch (nextError) {
        setError(getErrorMessage(nextError));
      }
    },
    [api, loadMetadata],
  );

  const startWeixinBind = useCallback(async () => {
    setBusy(true);
    setError("");
    setMessage("正在请求微信二维码...");
    setMessageType("info");

    try {
      const nextBinding = await api<WeixinBinding>("/api/weixin/bind", {
        method: "POST",
        body: JSON.stringify({
          baseUrl: (draft.baseUrl ?? "").trim() || undefined,
        }),
      });
      setBinding(nextBinding);
      setBusy(false);
      setMessage("二维码已返回，等待扫码结果...");
      setMessageType("info");
      void pollBinding(nextBinding.bindingId);
    } catch (nextError) {
      setBusy(false);
      setError(getErrorMessage(nextError));
    }
  }, [api, draft.baseUrl, pollBinding]);

  const cancelWeixinBind = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setBinding(null);
    setMessage("已取消当前绑定流程");
    setMessageType("info");
  }, []);

  const clearWeixinAccount = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      await api("/api/weixin/account", { method: "DELETE" });
      setBinding(null);
      setMessage("已清除保存的微信登录");
      setMessageType("success");
      await loadMetadata(true);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }, [api, loadMetadata]);

  useEffect(() => {
    if (!bridgeReady) {
      return;
    }

    if (!bridge.baseUrl) {
      setLoading(false);
      return;
    }

    void loadMetadata(false);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [bridge.baseUrl, bridgeReady, loadMetadata]);

  const selectedTypeName = selectedType || metadata?.selectedType || "";
  const selectedTypeDef = getTypeDef(selectedTypeName);
  const showWeixin = selectedTypeName === "weixin";
  const requiredFields = useMemo(
    () => currentFields.filter((field) => field.required),
    [currentFields],
  );
  const advancedFields = useMemo(
    () => currentFields.filter((field) => !field.required),
    [currentFields],
  );
  const missingPort = bridgeReady && !bridge.baseUrl;
  const statusClassName = cn(
    "rounded-2xl border px-3 py-2 text-sm",
    messageType === "success"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-600"
      : messageType === "error"
        ? "border-red-400/40 bg-red-500/10 text-red-600"
        : "border-amber-400/40 bg-amber-500/10 text-amber-700",
  );
  const renderField = (field: ChannelField) => {
    const value = draft[field.key] ?? "";
    const full = field.type === "json" || field.type === "string-array" || field.key === "instructions";

    return (
      <div key={field.key} className={full ? "space-y-2 xl:col-span-2" : "space-y-2"}>
        <Label>
          {field.label}
          {field.required ? " *" : ""}
        </Label>

        {field.type === "enum" ? (
          <Select
            value={value}
            onValueChange={(nextValue) => {
              setDraft((prev) => ({ ...prev, [field.key]: nextValue }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === "json" || field.type === "string-array" || field.key === "instructions" ? (
          <Textarea
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value;
              setDraft((prev) => ({ ...prev, [field.key]: nextValue }));
            }}
            className="min-h-32 font-mono text-xs"
          />
        ) : (
          <Input
            type={field.type === "number" ? "number" : field.type === "secret" ? "password" : "text"}
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value;
              setDraft((prev) => ({ ...prev, [field.key]: nextValue }));
            }}
          />
        )}

        {field.description ? <p className="text-xs text-muted-foreground">{field.description}</p> : null}
      </div>
    );
  };
  const renderFieldsGrid = (fields: ChannelField[]) => {
    if (!fields.length) {
      return null;
    }

    return <div className="grid gap-4 xl:grid-cols-2">{fields.map(renderField)}</div>;
  };

  if (missingPort) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/96 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">需要在软件内打开</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  当前页面缺少 port 参数，无法连接本地 TRAM 桥接服务。
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              请从软件内重新打开该页面，确保 URL 携带 GET port 参数后再使用 channel 配置功能。
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-accent" />
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-foreground">TRAM</span>
                <span className="ml-2 text-sm font-normal text-muted-foreground">Channel Configuration</span>
              </h1>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              <Button
                size="sm"
                variant={appearance === "light" ? "default" : "ghost"}
                className="h-7 gap-1.5 px-2.5 text-xs shadow-none"
                onClick={() => setAppearance("light")}
              >
                <Sun className="h-3.5 w-3.5" /> Light
              </Button>
              <Button
                size="sm"
                variant={appearance === "dark" ? "default" : "ghost"}
                className="h-7 gap-1.5 px-2.5 text-xs shadow-none"
                onClick={() => setAppearance("dark")}
              >
                <Moon className="h-3.5 w-3.5" /> Dark
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex w-full flex-1 min-h-0 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
        <section className="w-full min-h-0 flex-[1.4] overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:w-auto">
          <div className="h-full overflow-y-auto p-4 md:p-5">
            <div className="space-y-4">
              <Card className="rounded-2xl border-border/70 bg-background/60 shadow-none">
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>频道配置</CardTitle>
                      <CardDescription>
                        填写你的消息完成频道的配置
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void loadMetadata(false)} disabled={loading || busy}>
                      {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
                      刷新
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {loading ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-3 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在加载 metadata...
                    </div>
                  ) : null}

                  {!loading && metadata ? (
                    <>
                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Channel Name</Label>
                          <Input
                            value={channelName}
                            placeholder="例如：my-bot"
                            onChange={(event) => {
                              setChannelName(event.target.value);
                            }}
                            onBlur={(event) => {
                              void loadMetadata(false, event.target.value);
                            }}
                          />
                          <p className="text-xs text-muted-foreground">对每个频道进行分类。</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Channel Type</Label>
                          <Select
                            value={selectedTypeName}
                            onValueChange={(nextType) => {
                              setSelectedType(nextType);
                              setDraft((prev) => ({ ...prev, type: nextType }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="请选择 type" />
                            </SelectTrigger>
                            <SelectContent>
                              {(metadata.channelTypes ?? []).map((item) => (
                                <SelectItem key={item.type} value={item.type}>
                                  {item.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {renderFieldsGrid(requiredFields)}

                      {advancedFields.length ? (
                        <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-3 md:p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold tracking-tight">高级选项</h3>
                              <p className="text-xs text-muted-foreground">除必填项外的字段默认折叠在这里。</p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() => setAdvancedOpen((open) => !open)}
                            >
                              {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              {advancedOpen ? "收起" : "展开"}
                            </Button>
                          </div>

                          {advancedOpen ? <div className="grid gap-4 xl:grid-cols-2">{advancedFields.map(renderField)}</div> : null}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2 border-t border-border/70 pt-1">
                        <Button onClick={() => void saveChannel()} disabled={busy || loading}>
                          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                          保存并退出
                        </Button>
                        <Button variant="destructive" onClick={() => void deleteCurrentChannel()} disabled={busy || loading || !effectiveChannelName}>
                          <Trash2 className="mr-1 h-4 w-4" />删除 Channel
                        </Button>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <aside className="w-full min-h-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:w-96 lg:min-w-96">
          <div className="h-full overflow-y-auto p-4 md:p-5">
            <div className="space-y-4">
              <Card className="rounded-2xl border-border/70 bg-background/60 shadow-none">
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>当前会话、校验和返回消息会集中显示在这里。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid gap-2 text-xs text-muted-foreground">
                  {/*  <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2">
                      <span>Bridge</span>
                      <span className="font-mono text-foreground">{bridge.baseUrl || "not connected"}</span>
                    </div>*/}
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2">
                      <span>Draft</span>
                      <span className="font-mono text-foreground">{metadata?.current?.exists ? "existing" : "new"}</span>
                    </div>{/*
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2">
                      <span>Selected Type</span>
                      <span className="font-mono text-foreground">{selectedTypeName || "-"}</span>
                    </div>*/}
                  </div>
                  {metadata?.current?.validationErrors?.length ? (
                    <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                      {metadata.current.validationErrors.join(" ")}
                    </div>
                  ) : null}
                  {error ? <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div> : null}
                  {message ? <div className={statusClassName}>{message}</div> : null}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/70 bg-background/60 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" /> Weixin QR Binding
                  </CardTitle>
                  <CardDescription>扫描二维码完成绑定</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showWeixin ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card px-3 py-4 text-sm text-muted-foreground">
                      切换 Channel Type 为 weixin 后可用。
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => void startWeixinBind()} disabled={busy || loading}>
                          开始二维码绑定
                        </Button>
                        <Button variant="outline" onClick={cancelWeixinBind} disabled={busy || loading || !binding}>
                          取消当前绑定
                        </Button>
                        <Button variant="destructive" onClick={() => void clearWeixinAccount()} disabled={busy || loading}>
                          清除已保存登录
                        </Button>
                      </div>

                      {binding ? (
                        <div className="space-y-2 rounded-2xl border border-border bg-card p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">status</span>
                            <Badge className="border border-border bg-background text-foreground">{binding.status}</Badge>
                          </div>
                          <p className="text-muted-foreground">{binding.message}</p>
                          <p className="font-mono text-xs text-muted-foreground">bindingId: {binding.bindingId}</p>
                          {binding.userId ? <p className="text-xs">userId: {binding.userId}</p> : null}
                          {binding.qrCodeUrl ? (
                            <a className="text-xs text-blue-600 underline" href={binding.qrCodeUrl} target="_blank" rel="noreferrer">
                              打开二维码图片
                            </a>
                          ) : null}
                        </div>
                      ) : null}

                      {/*selectedTypeDef?.supportsQrBinding ? (
                        <Badge className="border border-border bg-card text-foreground">supportsQrBinding: true</Badge>
                      ) : null*/}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
