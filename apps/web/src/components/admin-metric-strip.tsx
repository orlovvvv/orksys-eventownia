import { Badge } from "@orksys-eventownia/ui/components/badge";
import { cn } from "@orksys-eventownia/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

type AdminMetric = {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: LucideIcon;
  to?: string;
  tone?: "neutral" | "primary" | "warning" | "danger";
};

const toneClasses = {
  neutral: "text-muted-foreground",
  primary: "text-primary",
  warning: "text-secondary-foreground",
  danger: "text-destructive",
};

const badgeVariants = {
  neutral: "outline",
  primary: "default",
  warning: "secondary",
  danger: "destructive",
} as const;

export function AdminMetricStrip({ metrics, className }: { metrics: AdminMetric[]; className?: string }) {
  return (
    <div className={cn("grid overflow-hidden rounded-lg border border-border/70 bg-card md:grid-cols-2 xl:grid-cols-4", className)}>
      {metrics.map((metric) => {
        const content = <MetricContent metric={metric} />;
        return metric.to ? (
          <Link key={metric.label} to={metric.to} className="min-w-0 border-border/70 p-4 transition-colors hover:bg-muted/50 md:border-r md:last:border-r-0">
            {content}
          </Link>
        ) : (
          <div key={metric.label} className="min-w-0 border-border/70 p-4 md:border-r md:last:border-r-0">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function MetricContent({ metric }: { metric: AdminMetric }) {
  const Icon = metric.icon;
  const tone = metric.tone ?? "neutral";

  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{metric.label}</div>
        <div className="mt-2 text-2xl font-semibold leading-none">{metric.value}</div>
        {metric.detail ? <div className="mt-2 truncate text-xs text-muted-foreground">{metric.detail}</div> : null}
      </div>
      <Badge variant={badgeVariants[tone]} className="shrink-0">
        {Icon ? <Icon data-icon="inline-start" className={toneClasses[tone]} /> : null}
        {typeof metric.value === "number" ? metric.value : ""}
      </Badge>
    </div>
  );
}
