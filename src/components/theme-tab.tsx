"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { THEME_PRESETS, type ThemePreset } from "@/lib/types";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeTabProps {
  themeId: string;
  selectTheme: (id: string) => void;
}

export function ThemeTab({ themeId, selectTheme }: ThemeTabProps) {
  return (
    <div className="space-y-2">
      <div className="sr-only">
        <Palette className="h-4 w-4 text-accent" />
        <span>主题选择</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {THEME_PRESETS.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={themeId === theme.id}
            onClick={() => selectTheme(theme.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  isActive,
  onClick,
}: {
  theme: ThemePreset;
  isActive: boolean;
  onClick: () => void;
}) {
  const { colors } = theme;

  return (
    <Card
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-xl transition-all hover:border-accent/50",
        isActive && "border-accent ring-1 ring-accent"
      )}
      onClick={onClick}
    >
      <CardContent className="flex aspect-[1/1.02] h-full flex-col p-2.5">
        <div
          className="overflow-hidden rounded-md border"
          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        >
          <div
            className="flex items-center gap-1 px-2 py-1"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#ff5f56" }} />
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#ffbd2e" }} />
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#27c93f" }} />
            </div>
            <span className="ml-1 text-[8px]" style={{ color: colors.mutedFg }}>terminal</span>
          </div>
          <div className="space-y-0.5 px-2 py-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[8px]" style={{ color: colors.accent }}>$</span>
              <span className="text-[8px]" style={{ color: colors.fg }}>tram init</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px]" style={{ color: colors.primary }}>&#x25B6;</span>
              <span className="text-[8px]" style={{ color: colors.mutedFg }}>loading...</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px]" style={{ color: colors.accent }}>✓</span>
              <span className="text-[8px]" style={{ color: colors.fg }}>ready</span>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between pt-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium">{theme.name}</span>
            {isActive ? (
              <Badge className="border-accent/20 bg-accent/10 px-1.5 py-0 text-[9px] text-accent">
                <Check className="h-2.5 w-2.5" />
              </Badge>
            ) : null}
          </div>
          <div className="mt-3 flex gap-1">
            {[colors.bg, colors.fg, colors.accent, colors.border, colors.primary].map((c, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-sm"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
