"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProvidersTab } from "@/components/providers-tab";
import { ThemeTab } from "@/components/theme-tab";
import { ApprovalTab } from "@/components/approval-tab";
import { ProxyTab } from "@/components/proxy-tab";
import { GeneralTab } from "@/components/general-tab";
import { useConfigStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Save, Copy, Check, Download, Terminal, Moon, Sun, X, Loader2 } from "lucide-react";

type UiAppearance = "light" | "dark";
type SaveStatus = "idle" | "saving" | "success" | "failed";

export default function Home() {
  const store = useConfigStore();
  const [saveOpen, setSaveOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appearance, setAppearance] = useState<UiAppearance>("light");
  const [appearanceInitialized, setAppearanceInitialized] = useState(false);
  const [themeCollapsed, setThemeCollapsed] = useState(false);
  const [networkCollapsed, setNetworkCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);

  // ── Pollinations OAuth callback detection ──
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.slice(1));
    const apiKey = params.get('api_key');
    if (!apiKey) return;
    // Clean hash from URL
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (window.opener) {
      setIsOAuthCallback(true);
      window.opener.postMessage({ type: 'pollinations_oauth', api_key: apiKey }, '*');
      setTimeout(() => window.close(), 500);
    }
  }, []);

  const config = useMemo(() => store.generateConfig(), [store.generateConfig]);
  const jsonOutput = useMemo(() => JSON.stringify(config), [config]);

  useEffect(() => {
    const savedAppearance = window.localStorage.getItem("tram-init-web-appearance");
    if (savedAppearance === "light" || savedAppearance === "dark") {
      setAppearance(savedAppearance);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setAppearance("dark");
    }
    setAppearanceInitialized(true);
  }, []);

  useEffect(() => {
    if (!appearanceInitialized) return;
    const root = document.documentElement;
    root.dataset.uiAppearance = appearance;
    root.style.colorScheme = appearance;
    window.localStorage.setItem("tram-init-web-appearance", appearance);
  }, [appearance, appearanceInitialized]);

  useEffect(() => {
    if (!saveOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSaveOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveOpen]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    const params = new URLSearchParams(window.location.search);
    const port = params.get("port");

    // No server port — fall back to copy dialog immediately
    if (!port) {
      setSaveOpen(true);
      return;
    }

    setSaveStatus("saving");

    const payload = JSON.stringify({ settings: config });
    try {
      const res = await fetch(`http://localhost:${port}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (error) {
      console.error("Failed to save config:", error);
      setSaveStatus("idle");
      setSaveOpen(true);
    }
  };

  return (
    isOAuthCallback ? (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <Check className="h-8 w-8 text-green-500 mx-auto" />
          <p className="text-sm">授权完成，正在关闭窗口...</p>
        </div>
      </div>
    ) :
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-accent" />
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-foreground">TRAM</span>
                <span className="ml-2 text-sm font-normal text-muted-foreground">Configuration</span>
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
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleSave}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saveStatus === "success" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saveStatus === "saving" ? "保存中..." : saveStatus === "success" ? "已保存" : "保存"}
            </Button>
          </div>
        </div>
      </header>

      {saveOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSaveOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-dialog-title"
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 border-b border-border px-5 py-4 pr-12">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-tight" id="save-dialog-title">
                <Terminal className="h-4 w-4 text-accent" />
                配置输出
                <Badge className="ml-1 border border-border bg-secondary text-[10px] text-foreground">
                  settings.json
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                复制以下单行 JSON 到 <span className="font-mono text-foreground">~/.tram/settings.json</span>
              </p>
              <button
                type="button"
                className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => setSaveOpen(false)}
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground">单行 JSON</span>
                  <Badge className="border border-border bg-background text-[9px] text-muted-foreground">
                    {jsonOutput.length} bytes
                  </Badge>
                </div>
                <div className="max-h-[min(55vh,24rem)] min-w-0 overflow-auto rounded border border-border bg-muted/60">
                  <pre className="min-w-0 whitespace-pre p-3 font-mono text-[11px] leading-5">
                    {jsonOutput}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-4">
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "已复制" : "复制"}
              </Button>
              <Button size="sm" className="h-7 gap-1 text-xs" onClick={handleDownload}>
                <Download className="h-3 w-3" /> 下载
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="flex w-full flex-1 min-h-0 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
        <section className="w-full min-h-0 flex-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:w-3/5">
          <div className="h-full overflow-y-auto p-4 md:p-5">
            <ProvidersTab
              providers={store.providers}
              addProvider={store.addProvider}
              removeProvider={store.removeProvider}
              updateProvider={store.updateProvider}
              startPollinationsOAuth={store.startPollinationsOAuth}
              pollinationsLoading={store.pollinationsLoading}
              pollinationsError={store.pollinationsError}
            />
          </div>
        </section>

        <div className="flex w-full min-h-0 flex-7 flex-col gap-4 lg:w-2/5">
          <section className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex h-full flex-col overflow-hidden">
              <div className="shrink-0 border-b border-border px-4 py-4 md:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">编辑模式</h2>
                  <ApprovalTab approvalMode={store.approvalMode} setApprovalMode={store.setApprovalMode} />
                </div>
              </div>
            </div>
          </section>

          <section
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
              themeCollapsed ? "shrink-0" : "min-h-0 flex-4"
            )}
          >
            <div className="flex h-full flex-col overflow-hidden">
              <div className="shrink-0 border-b border-border px-4 py-4 md:px-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">主题选择</h2>
                  <div className="flex items-center gap-2">
                    <Badge className="border border-border bg-background text-[10px] text-muted-foreground">
                      {store.activeTheme.name}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => setThemeCollapsed((collapsed) => !collapsed)}
                    >
                      {themeCollapsed ? "展开" : "收起"}
                    </Button>
                  </div>
                </div>
              </div>
              {themeCollapsed ? null : (
                <div className="flex-1 overflow-y-auto p-4 md:p-5">
                  <ThemeTab themeId={store.themeId} selectTheme={store.selectTheme} />
                </div>
              )}
            </div>
          </section>

          <section
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
              networkCollapsed ? "shrink-0" : "min-h-0 flex-3"
            )}
          >
            <div className="flex h-full flex-col overflow-hidden">
              <div className="shrink-0 border-b border-border px-4 py-4 md:px-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">更多设置</h2>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setNetworkCollapsed((collapsed) => !collapsed)}
                  >
                    {networkCollapsed ? "展开" : "收起"}
                  </Button>
                </div>
              </div>
              {networkCollapsed ? null : (
                <div className="flex-1 overflow-y-auto p-4 md:p-5">
                  <div className="space-y-6">
                    <ProxyTab proxy={store.proxy} setProxy={store.setProxy} />
                    <div className="border-t border-border pt-6">
                      <GeneralTab
                        douyinMcpEndpoint={store.douyinMcpEndpoint}
                        siliconFlowApiKey={store.siliconFlowApiKey}
                        injectToolCallIntro={store.injectToolCallIntro}
                        setDouyinMcpEndpoint={store.setDouyinMcpEndpoint}
                        setSiliconFlowApiKey={store.setSiliconFlowApiKey}
                        setInjectToolCallIntro={store.setInjectToolCallIntro}
                        mcpLoading={store.mcpLoading}
                        mcpError={store.mcpError}
                        startMcpOAuth={store.startMcpOAuth}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
