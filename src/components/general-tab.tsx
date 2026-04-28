"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, SlidersHorizontal, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface GeneralTabProps {
  modelTemperature: string;
  modelMaxTokens: string;
  fallbackModelsText: string;
  douyinMcpEndpoint: string;
  siliconFlowApiKey: string;
  injectToolCallIntro: boolean;
  setModelTemperature: (v: string) => void;
  setModelMaxTokens: (v: string) => void;
  setFallbackModelsText: (v: string) => void;
  setDouyinMcpEndpoint: (v: string) => void;
  setSiliconFlowApiKey: (v: string) => void;
  setInjectToolCallIntro: (v: boolean) => void;
  mcpLoading: boolean;
  mcpError: string;
  startMcpOAuth: () => void;
}

export function GeneralTab({
  modelTemperature,
  modelMaxTokens,
  fallbackModelsText,
  douyinMcpEndpoint,
  siliconFlowApiKey,
  injectToolCallIntro,
  setModelTemperature,
  setModelMaxTokens,
  setFallbackModelsText,
  setDouyinMcpEndpoint,
  setSiliconFlowApiKey,
  setInjectToolCallIntro,
  mcpLoading,
  mcpError,
  startMcpOAuth,
}: GeneralTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-medium">通用设置</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/40 p-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <div>
              <h4 className="text-sm font-medium">模型参数</h4>
              <p className="text-[11px] text-muted-foreground">
                会写入 model.generationConfig，并同步到每个 modelProviders 条目，保证 provider 模型也能吃到这些采样参数。
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-mono">temperature</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="例如 0.2"
                value={modelTemperature}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelTemperature(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">留空则沿用模型默认采样温度。</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono">max_tokens</Label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="例如 4096"
                value={modelMaxTokens}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModelMaxTokens(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">留空则保持 Qwen Code 的自适应输出 token 策略。</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-mono">Fallback Models</Label>
            <Textarea
              placeholder={"backup-model\nopenai:gpt-4.1-mini\nanthropic:claude-3-5-sonnet"}
              value={fallbackModelsText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFallbackModelsText(e.target.value)}
              className="min-h-24 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              一行一个，也支持逗号分隔。可以填已配置模型，也可以直接填 openai:gpt-4.1-mini 这种跨 provider 目标。
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-mono">抖音 MCP 端点</Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="点击右侧按钮一键获取..."
              value={douyinMcpEndpoint}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDouyinMcpEndpoint(e.target.value)}
              className="font-mono text-xs flex-1"
            />
            <Button
              size="sm"
              variant={douyinMcpEndpoint ? "outline" : "default"}
              className="h-8 shrink-0 gap-1.5 text-xs"
              onClick={startMcpOAuth}
              disabled={mcpLoading}
            >
              {mcpLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  获取中...
                </>
              ) : douyinMcpEndpoint ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  重新获取
                </>
              ) : (
                "一键获取"
              )}
            </Button>
          </div>
          {mcpError ? (
            <p className="flex items-center gap-1 text-[11px] text-red-500">
              <AlertCircle className="h-3 w-3" />
              {mcpError}
            </p>
          ) : douyinMcpEndpoint ? (
            <p className="flex items-center gap-1 text-[11px] text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              MCP 端点已就绪
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              通过魔搭社区 OAuth 授权自动部署并获取抖音 MCP Server 地址
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-mono">硅基流动 API Key</Label>
          <Input
            type="password"
            placeholder="sk-..."
            value={siliconFlowApiKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiliconFlowApiKey(e.target.value)}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            用于增强知识库搜索 语音转文本 图片转文本功能
          </p>
        </div>
        <div className="flex items-center justify-between space-x-2 pt-2">
          <div className="flex flex-col space-y-1">
            <Label className="text-xs font-medium">注入工具调用介绍</Label>
            <p className="text-[11px] text-muted-foreground">询问是否在提示词内注入工具调用介绍</p>
          </div>
          <Switch 
            checked={injectToolCallIntro} 
            onCheckedChange={setInjectToolCallIntro} 
          />
        </div>
      </div>
    </div>
  );
}
