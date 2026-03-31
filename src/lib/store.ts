"use client";

import { useState, useCallback, useEffect } from "react";
import type { Provider, ApprovalMode, ProxyConfig, TramConfig, ProviderEntry } from "./types";
import { THEME_PRESETS } from "./types";

function generateModelAlias(modelId: string, providerId: string): string {
  const modelPart = modelId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const providerPart = providerId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 9).toLowerCase();
  const base = modelPart || "model";
  return `${base}-${providerPart}${suffix}`;
}

const STORAGE_KEY = 'tram-init-web-config';

interface SavedConfig {
  providers: Provider[];
  approvalMode: ApprovalMode;
  themeId: string;
  proxy: ProxyConfig;
  douyinMcpEndpoint: string;
  siliconFlowApiKey: string;
}

function loadSavedConfig(): SavedConfig | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedConfig;
  } catch {
    return null;
  }
}

export function useConfigStore() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>("yolo");
  const [themeId, setThemeId] = useState("qwen-dark");
  const [proxy, setProxy] = useState<ProxyConfig>({ enabled: false, mode: "off", url: "" });
  const [douyinMcpEndpoint, setDouyinMcpEndpoint] = useState("");
  const [siliconFlowApiKey, setSiliconFlowApiKey] = useState("");
  const [mcpLoading, setMcpLoading] = useState(false);
  const [mcpError, setMcpError] = useState("");
  const [pollinationsLoading, setPollinationsLoading] = useState(false);
  const [pollinationsError, setPollinationsError] = useState("");
  const [storageLoaded, setStorageLoaded] = useState(false);

  // ── localStorage: load on mount ──
  useEffect(() => {
    const saved = loadSavedConfig();
    if (saved) {
      if (saved.providers?.length) setProviders(saved.providers);
      if (saved.approvalMode) setApprovalMode(saved.approvalMode);
      if (saved.themeId) setThemeId(saved.themeId);
      if (saved.proxy) setProxy(saved.proxy);
      if (saved.douyinMcpEndpoint) setDouyinMcpEndpoint(saved.douyinMcpEndpoint);
      if (saved.siliconFlowApiKey) setSiliconFlowApiKey(saved.siliconFlowApiKey);
    }
    setStorageLoaded(true);
  }, []);

  // ── localStorage: auto-save on changes ──
  useEffect(() => {
    if (!storageLoaded) return;
    try {
      const data: SavedConfig = {
        providers,
        approvalMode,
        themeId,
        proxy,
        douyinMcpEndpoint,
        siliconFlowApiKey,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded etc. */ }
  }, [storageLoaded, providers, approvalMode, themeId, proxy, douyinMcpEndpoint, siliconFlowApiKey]);

  const activeTheme = THEME_PRESETS.find((t) => t.id === themeId) ?? THEME_PRESETS[0];

  const addProvider = useCallback((provider: Provider) => {
    setProviders((prev) => [...prev, provider]);
  }, []);

  const removeProvider = useCallback((id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateProvider = useCallback((id: string, updates: Partial<Provider>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const selectTheme = useCallback((id: string) => {
    setThemeId(id);
  }, []);

  const generateConfig = useCallback((): TramConfig => {
    const modelProviders: Record<string, ProviderEntry[]> = {};
    const env: Record<string, string> = {};
    let firstModelId: string | undefined;

    for (const p of providers) {
      const authType = p.type;
      if (!modelProviders[authType]) modelProviders[authType] = [];

      const upstreamModelId = p.defaultModel;
      const isOpenAI = authType === "openai";

      const localModelId = isOpenAI
        ? generateModelAlias(upstreamModelId, p.id)
        : upstreamModelId;

      const modelName = isOpenAI && p.name
        ? `[${p.name}]${upstreamModelId}`
        : upstreamModelId;

      const entry: ProviderEntry = {
        id: localModelId,
        name: modelName,
        ...(isOpenAI ? { upstreamModelId } : {}),
        ...(p.apiKeyEnvVar ? { envKey: p.apiKeyEnvVar } : {}),
        ...(p.baseUrl ? { baseUrl: p.baseUrl } : {}),
      };

      modelProviders[authType].push(entry);

      if (!firstModelId) firstModelId = localModelId;

      if (p.apiKey && p.apiKeyEnvVar) {
        env[p.apiKeyEnvVar] = p.apiKey;
      }
    }

    const firstProvider = providers[0];
    const authType = firstProvider?.type ?? "openai";

    const config: TramConfig = {
      $version: 3,
      modelProviders,
      env,
      security: {
        auth: { selectedType: authType },
      },
      model: {
        ...(firstModelId ? { name: firstModelId } : {}),
      },
      tools: { approvalMode },
      ui: { theme: activeTheme.name },
    };

    if (proxy.enabled && proxy.url) {
      config.security.proxy = proxy.url;
      config.security.proxyMode = proxy.mode;
    }

    if (douyinMcpEndpoint || siliconFlowApiKey) {
      config.general = {};
      if (douyinMcpEndpoint) config.general.douyinMcpEndpoint = douyinMcpEndpoint;
      if (siliconFlowApiKey) config.general.siliconFlowApiKey = siliconFlowApiKey;
    }

    return config;
  }, [providers, approvalMode, activeTheme, proxy, douyinMcpEndpoint, siliconFlowApiKey]);

  const WORKER_BASE = 'https://modelscope.912778.xyz';

  const startMcpOAuth = useCallback(() => {
    setMcpLoading(true);
    setMcpError('');

    fetch(`${WORKER_BASE}/api/oauth/url`)
      .then((r) => r.json())
      .then(({ auth_url }) => {
        const popup = window.open(auth_url, 'modelscope_oauth', 'width=600,height=700');
        if (!popup) {
          setMcpError('弹窗被拦截，请允许弹窗后重试');
          setMcpLoading(false);
          return;
        }

        let messageReceived = false;

        const onMessage = (e: MessageEvent) => {
          if (e.data?.type !== 'modelscope_oauth') return;
          messageReceived = true;
          window.removeEventListener('message', onMessage);
          const token = e.data.access_token as string;
          if (!token) {
            setMcpError('授权失败：未获取到 token');
            setMcpLoading(false);
            return;
          }
          // 用 token 获取/部署 MCP
          fetch(`${WORKER_BASE}/api/mcp/ensure`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.mcp_url) {
                setDouyinMcpEndpoint(data.mcp_url);
              } else {
                setMcpError(data.error || '获取 MCP 地址失败');
              }
            })
            .catch((err) => setMcpError(err.message))
            .finally(() => setMcpLoading(false));
        };

        window.addEventListener('message', onMessage);

        // 超时兜底 — 仅在未收到 postMessage 时才报错
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            if (messageReceived) return;
            setTimeout(() => {
              window.removeEventListener('message', onMessage);
              setMcpLoading((loading) => {
                if (loading) setMcpError('授权窗口已关闭，未完成授权');
                return false;
              });
            }, 1500);
          }
        }, 500);
      })
      .catch((err) => {
        setMcpError(err.message);
        setMcpLoading(false);
      });
  }, [setDouyinMcpEndpoint]);

  const startPollinationsOAuth = useCallback((onSuccess: (apiKey: string) => void) => {
    setPollinationsLoading(true);
    setPollinationsError('');

    const redirectUrl = window.location.origin + window.location.pathname + window.location.search;
    const authUrl = `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUrl)}&app_key=pk_Bl8CdIWBVPsm4IPa&expiry=360`;

    const popup = window.open(authUrl, 'pollinations_oauth', 'width=600,height=700');
    if (!popup) {
      setPollinationsError('弹窗被拦截，请允许弹窗后重试');
      setPollinationsLoading(false);
      return;
    }

    let resolved = false;

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'pollinations_oauth') return;
      resolved = true;
      window.removeEventListener('message', onMessage);
      const apiKey = e.data.api_key as string;
      if (apiKey) {
        onSuccess(apiKey);
      } else {
        setPollinationsError('授权失败：未获取到 API Key');
      }
      setPollinationsLoading(false);
    };

    window.addEventListener('message', onMessage);

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        if (resolved) return;
        setTimeout(() => {
          window.removeEventListener('message', onMessage);
          setPollinationsLoading((loading) => {
            if (loading) setPollinationsError('授权窗口已关闭，未完成授权');
            return false;
          });
        }, 1500);
      }
    }, 500);
  }, []);

  return {
    providers,
    approvalMode,
    themeId,
    proxy,
    activeTheme,
    douyinMcpEndpoint,
    siliconFlowApiKey,
    addProvider,
    removeProvider,
    updateProvider,
    setApprovalMode,
    selectTheme,
    setProxy,
    setDouyinMcpEndpoint,
    setSiliconFlowApiKey,
    mcpLoading,
    mcpError,
    startMcpOAuth,
    pollinationsLoading,
    pollinationsError,
    startPollinationsOAuth,
    generateConfig,
  };
}
