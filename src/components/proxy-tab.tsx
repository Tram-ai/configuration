"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProxyConfig } from "@/lib/types";
import { Globe } from "lucide-react";

interface ProxyTabProps {
  proxy: ProxyConfig;
  setProxy: (proxy: ProxyConfig) => void;
}

export function ProxyTab({ proxy, setProxy }: ProxyTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-medium">代理设置</h3>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">启用代理</Label>
          <p className="text-xs text-muted-foreground">通过代理服务器连接 API</p>
        </div>
        <Switch
          checked={proxy.enabled}
          onCheckedChange={(checked) => setProxy({ ...proxy, enabled: checked })}
        />
      </div>

      {proxy.enabled && (
        <div className="space-y-3 pl-1 border-l-2 border-accent/20 ml-1">
          <div className="pl-3">
            <Label className="text-xs text-muted-foreground mb-1 block">代理模式</Label>
            <Select
              value={proxy.mode}
              onValueChange={(v) => setProxy({ ...proxy, mode: v as ProxyConfig["mode"] })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system" className="text-xs">系统代理</SelectItem>
                <SelectItem value="custom" className="text-xs">自定义</SelectItem>
                <SelectItem value="off" className="text-xs">关闭</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {proxy.mode === "custom" && (
            <div className="pl-3">
              <Label className="text-xs text-muted-foreground mb-1 block">代理地址</Label>
              <Input
                className="h-8 text-xs font-mono"
                placeholder="http://127.0.0.1:7890"
                value={proxy.url}
                onChange={(e) => setProxy({ ...proxy, url: e.target.value })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
