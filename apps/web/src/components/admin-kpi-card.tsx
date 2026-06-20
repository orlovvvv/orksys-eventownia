import { Card, CardContent } from "@orksys-eventownia/ui/components/card";
import { cn } from "@orksys-eventownia/ui/lib/utils";
import type { LucideIcon } from "lucide-react";

type AdminKpiCardProps = {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon: LucideIcon;
  tone?: "primary" | "neutral" | "warning" | "danger";
};

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-secondary text-secondary-foreground",
  danger: "bg-destructive/10 text-destructive",
};

export function AdminKpiCard({ label, value, detail, icon: Icon, tone = "neutral" }: AdminKpiCardProps) {
  return (
    <Card size="sm" className="min-h-32">
      <CardContent className="flex h-full items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
          <div className="text-3xl font-bold leading-none text-foreground">{value}</div>
          {detail ? <div className="text-sm text-muted-foreground">{detail}</div> : null}
        </div>
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", toneClasses[tone])}>
          <Icon />
        </div>
      </CardContent>
    </Card>
  );
}
