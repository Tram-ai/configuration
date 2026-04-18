"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Server, Eye, EyeOff, Edit2, Check, X, Loader2, KeyRound, ChevronDown } from "lucide-react";
import type { Provider } from "@/lib/types";
import { PROVIDER_PRESETS, supportsGateway, getGatewayUrl } from "@/lib/types";

function generateEnvKey(baseName: string): string {
  const normalized = baseName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${normalized || 'API_KEY'}_${suffix}`;
}

function isPollinationsProvider(name: string, baseUrl: string): boolean {
  return name.toLowerCase().includes('pollinations') || baseUrl.includes('pollinations');
}

interface ProvidersTabProps {
  providers: Provider[];
  addProvider: (provider: Provider) => void;
  removeProvider: (id: string) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  startPollinationsOAuth: (onSuccess: (apiKey: string) => void) => void;
  pollinationsLoading: boolean;
  pollinationsError: string;
}

export function ProvidersTab({ providers, addProvider, removeProvider, updateProvider, startPollinationsOAuth, pollinationsLoading, pollinationsError }: ProvidersTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [preset, setPreset] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState("openai");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [useGateway, setUseGateway] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetForm = () => {
    setPreset("");
    setCustomName("");
    setCustomType("openai");
    setCustomBaseUrl("");
    setCustomApiKey("");
    setCustomModel("");
    setIsCustom(false);
    setUseGateway(false);
    setShowForm(false);
  };

  const handlePresetSelect = (name: string) => {
    if (name === "__custom__") {
      setIsCustom(true);
      setPreset("");
      setUseGateway(false);
      return;
    }
    setIsCustom(false);
    setPreset(name);
    setUseGateway(false);
    const p = PROVIDER_PRESETS[name];
    if (p) {
      setCustomName(name);
      setCustomType(p.type);
      setCustomBaseUrl(p.baseUrl);
      setCustomModel(p.defaultModel);
    }
  };

  const handleAdd = () => {
    const id = `provider-${Date.now()}`;
    const presetConfig = !isCustom && preset ? PROVIDER_PRESETS[preset] : null;
    const baseEnvName = presetConfig?.apiKeyEnvVar || customName || 'CUSTOM_API_KEY';
    const envVar = customApiKey ? generateEnvKey(baseEnvName) : '';
    const providerName = customName || preset || "Custom Provider";
    const effectiveBaseUrl = useGateway && supportsGateway(providerName)
      ? getGatewayUrl(providerName)!
      : customBaseUrl;
    addProvider({
      id,
      name: providerName,
      type: customType,
      baseUrl: effectiveBaseUrl,
      apiKeyEnvVar: envVar,
      apiKey: customApiKey,
      defaultModel: customModel,
      useGateway: useGateway && supportsGateway(providerName),
    });
    resetForm();
  };

  const handlePollinationsAuth = () => {
    startPollinationsOAuth((apiKey) => {
      setCustomApiKey(apiKey);
      setCustomBaseUrl('https://gen.pollinations.ai/v1');
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-medium">
            供应商 <span className="text-muted-foreground">({providers.length})</span>
          </h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1">
          <Plus className="h-3 w-3" /> 添加供应商
        </Button>
      </div>

      {showForm && (
        <Card className="border-accent/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">添加新供应商</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">选择预设或自定义</Label>
              <Select onValueChange={handlePresetSelect} value={isCustom ? "__custom__" : preset}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="选择供应商预设..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDER_PRESETS).map(([name, conf]) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      <div className="flex items-center gap-2">
                        {name}
                        {conf.tags?.map((t) => (
                          <span key={t} className="rounded bg-accent/20 px-1 py-0.5 text-[9px] text-accent">
                            {t}
                          </span>
                        ))}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="text-xs text-accent">
                    ✦ 自定义供应商
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(preset || isCustom) && (
              <>
                {isCustom && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">名称</Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="My Provider"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">API 类型</Label>
                      <Select value={customType} onValueChange={setCustomType}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai" className="text-xs">OpenAI Compatible</SelectItem>
                          <SelectItem value="anthropic" className="text-xs">Anthropic</SelectItem>
                          <SelectItem value="gemini" className="text-xs">Gemini</SelectItem>
                          <SelectItem value="vertex-ai" className="text-xs">Vertex AI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Base URL</Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    placeholder="https://api.example.com/v1"
                    value={useGateway && supportsGateway(customName || preset) ? getGatewayUrl(customName || preset)! : customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    disabled={useGateway && supportsGateway(customName || preset)}
                  />
                </div>

                {supportsGateway(customName || preset) && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="accent-accent h-3.5 w-3.5"
                      checked={useGateway}
                      onChange={(e) => setUseGateway(e.target.checked)}
                    />
                    <span className="text-xs text-muted-foreground">
                      启用 Cloudflare AI Gateway 中转（优化网络）
                    </span>
                  </label>
                )}

                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-8 text-xs font-mono flex-1"
                        type="password"
                        placeholder="sk-..."
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                      />
                      {isPollinationsProvider(customName || preset, customBaseUrl) && (
                        <Button
                          size="sm"
                          variant={customApiKey ? "outline" : "default"}
                          className="h-8 shrink-0 gap-1.5 text-xs"
                          onClick={handlePollinationsAuth}
                          disabled={pollinationsLoading}
                        >
                          {pollinationsLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              授权中...
                            </>
                          ) : (
                            <>
                              <KeyRound className="h-3.5 w-3.5" />
                              OAuth 授权
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {pollinationsError && isPollinationsProvider(customName || preset, customBaseUrl) && (
                      <p className="text-[11px] text-red-500 mt-1">{pollinationsError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">默认模型</Label>
                  <div className="relative flex items-center">
                    <Input
                      className="h-8 text-xs font-mono pr-8"
                      placeholder="gpt-4o"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                    />
                    {preset && !isCustom && PROVIDER_PRESETS[preset]?.models && (
                      <>
                        <div className="absolute right-0 top-0 h-full w-8 flex items-center justify-center pointer-events-none text-muted-foreground">
                          <ChevronDown className="h-4 w-4" />
                        </div>
                        <select
                          className="absolute right-0 top-0 h-full w-8 opacity-0 cursor-pointer"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) setCustomModel(e.target.value);
                          }}
                        >
                          <option value="" disabled></option>
                          {PROVIDER_PRESETS[preset].models.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleAdd} className="gap-1 text-xs h-7">
                    <Plus className="h-3 w-3" /> 添加
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetForm} className="text-xs h-7">
                    取消
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {providers.length === 0 && !showForm && (
        <div className="border border-dashed border-border rounded-lg p-6 text-center">
          <Server className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">尚未添加供应商</p>
          <p className="text-xs text-muted-foreground mt-1">点击"添加供应商"开始配置</p>
        </div>
      )}

      <div className="space-y-2">
        {providers.map((p) => (
          <Card key={p.id} className="group">
            <CardContent className="p-3">
              {editingId === p.id ? (
                <ProviderEditForm
                  provider={p}
                  onSave={(updates) => {
                    updateProvider(p.id, updates);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  startPollinationsOAuth={startPollinationsOAuth}
                  pollinationsLoading={pollinationsLoading}
                  pollinationsError={pollinationsError}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center text-accent text-xs font-bold shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        <Badge className="text-[10px] bg-accent/10 text-accent border-accent/20">
                          {p.type}
                        </Badge>
                        {p.useGateway && (
                          <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                            CF Gateway
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono truncate">
                          {p.baseUrl || "default"}
                        </span>
                        {p.apiKey && (
                          <button
                            onClick={() => toggleKeyVisibility(p.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {visibleKeys.has(p.id) ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </button>
                        )}
                        {p.apiKey && visibleKeys.has(p.id) && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {p.apiKey.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(p.id)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeProvider(p.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProviderEditForm({
  provider,
  onSave,
  onCancel,
  startPollinationsOAuth,
  pollinationsLoading,
  pollinationsError,
}: {
  provider: Provider;
  onSave: (updates: Partial<Provider>) => void;
  onCancel: () => void;
  startPollinationsOAuth: (onSuccess: (apiKey: string) => void) => void;
  pollinationsLoading: boolean;
  pollinationsError: string;
}) {
  const [name, setName] = useState(provider.name);
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl);
  const [apiKey, setApiKey] = useState(provider.apiKey);
  const [defaultModel, setDefaultModel] = useState(provider.defaultModel);
  const [gateway, setGateway] = useState(provider.useGateway ?? false);

  const handleSave = () => {
    const envVar = apiKey
      ? (provider.apiKeyEnvVar || generateEnvKey(name || 'API_KEY'))
      : '';
    const effectiveBaseUrl = gateway && supportsGateway(name)
      ? getGatewayUrl(name)!
      : baseUrl;
    onSave({ name, baseUrl: effectiveBaseUrl, apiKeyEnvVar: envVar, apiKey, defaultModel, useGateway: gateway && supportsGateway(name) });
  };

  const isPollinations = isPollinationsProvider(name, baseUrl);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">名称</Label>
          <Input className="h-7 text-xs" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">模型</Label>
          <div className="relative flex items-center">
            <Input 
              className="h-7 text-xs font-mono pr-7" 
              value={defaultModel} 
              onChange={(e) => setDefaultModel(e.target.value)} 
            />
            {PROVIDER_PRESETS[provider.name]?.models && (
              <>
                <div className="absolute right-0 top-0 h-full w-7 flex items-center justify-center pointer-events-none text-muted-foreground">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
                <select
                  className="absolute right-0 top-0 h-full w-7 opacity-0 cursor-pointer"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setDefaultModel(e.target.value);
                  }}
                >
                  <option value="" disabled></option>
                  {PROVIDER_PRESETS[provider.name]?.models?.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Base URL</Label>
        <Input className="h-7 text-xs font-mono" value={gateway && supportsGateway(name) ? getGatewayUrl(name)! : baseUrl} onChange={(e) => setBaseUrl(e.target.value)} disabled={gateway && supportsGateway(name)} />
      </div>
      {supportsGateway(name) && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-accent h-3.5 w-3.5"
            checked={gateway}
            onChange={(e) => setGateway(e.target.checked)}
          />
          <span className="text-xs text-muted-foreground">
            启用 Cloudflare AI Gateway 中转
          </span>
        </label>
      )}
      <div>
        <Label className="text-xs text-muted-foreground">API Key</Label>
        <div className="flex items-center gap-2">
          <Input className="h-7 text-xs font-mono flex-1" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          {isPollinations && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 gap-1 text-xs"
              onClick={() => startPollinationsOAuth((key) => {
                setApiKey(key);
                setBaseUrl('https://gen.pollinations.ai/v1');
              })}
              disabled={pollinationsLoading}
            >
              {pollinationsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
              OAuth
            </Button>
          )}
        </div>
        {pollinationsError && isPollinations && (
          <p className="text-[11px] text-red-500 mt-0.5">{pollinationsError}</p>
        )}
      </div>
      <div className="flex gap-1 pt-1">
        <Button size="sm" className="h-6 text-xs gap-1" onClick={handleSave}>
          <Check className="h-3 w-3" /> 保存
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={onCancel}>
          <X className="h-3 w-3" /> 取消
        </Button>
      </div>
    </div>
  );
}
