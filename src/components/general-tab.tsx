"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface GeneralTabProps {
  douyinMcpEndpoint: string;
  siliconFlowApiKey: string;
  setDouyinMcpEndpoint: (v: string) => void;
  setSiliconFlowApiKey: (v: string) => void;
  mcpLoading: boolean;
  mcpError: string;
  startMcpOAuth: () => void;
}

export function GeneralTab({
  douyinMcpEndpoint,
  siliconFlowApiKey,
  setDouyinMcpEndpoint,
  setSiliconFlowApiKey,
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
          <Label className="text-xs font-mono">硅基流动 OCR API Key</Label>
          <Input
            type="password"
            placeholder="sk-..."
            value={siliconFlowApiKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiliconFlowApiKey(e.target.value)}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            SiliconFlow OCR 服务的 API 密钥
          </p>
        </div>
      </div>
    </div>
  );
}
