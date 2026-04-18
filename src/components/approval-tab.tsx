"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APPROVAL_MODES, type ApprovalMode } from "@/lib/types";
import { Check } from "lucide-react";

interface ApprovalTabProps {
  approvalMode: ApprovalMode;
  setApprovalMode: (mode: ApprovalMode) => void;
}

export function ApprovalTab({ approvalMode, setApprovalMode }: ApprovalTabProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {APPROVAL_MODES.map((mode) => (
        <Button
          key={mode.value}
          type="button"
          size="sm"
          variant={approvalMode === mode.value ? "default" : "outline"}
          className={cn(
            "h-8 rounded-lg px-3 text-xs",
            approvalMode !== mode.value && "bg-background"
          )}
          onClick={() => setApprovalMode(mode.value)}
          aria-pressed={approvalMode === mode.value}
        >
          <span className="flex items-center gap-2">
            <span className="text-sm" aria-hidden="true">{mode.icon}</span>
            <span>{mode.label}</span>
          </span>
          {approvalMode === mode.value ? <Check className="h-3.5 w-3.5" /> : null}
        </Button>
      ))}
    </div>
  );
}
