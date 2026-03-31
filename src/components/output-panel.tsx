"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileJson, Copy, Check, Download, ChevronDown, ChevronUp } from "lucide-react";
import type { TramConfig } from "@/lib/types";

interface OutputPanelProps {
  generateConfig: () => TramConfig;
}

export function OutputPanel({ generateConfig }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const config = useMemo(() => generateConfig(), [generateConfig]);

  const compressedJson = useMemo(() => JSON.stringify(config), [config]);
  const prettyJson = useMemo(() => JSON.stringify(config, null, 2), [config]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(compressedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([prettyJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-accent" />
            <CardTitle className="text-sm">配置输出</CardTitle>
            <Badge className="text-[10px] bg-accent/10 text-accent border-accent/20">
              settings.json
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "收起" : "展开"}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "已复制" : "复制"}
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleDownload}>
              <Download className="h-3 w-3" /> 下载
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Textarea
            readOnly
            value={expanded ? prettyJson : compressedJson}
            className="font-mono text-xs min-h-[60px] max-h-[400px] resize-y bg-background/50"
            rows={expanded ? 20 : 3}
          />
          <div className="absolute bottom-2 right-2">
            <Badge className="text-[9px] bg-muted text-muted-foreground">
              {compressedJson.length} bytes
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
