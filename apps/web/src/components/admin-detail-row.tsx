import { cn } from "@orksys-eventownia/ui/lib/utils";

export function AdminDetailRow({
  label,
  value,
  description,
  actions,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2 border-b border-border/70 px-4 py-3 last:border-b-0 md:grid-cols-[180px_1fr_auto] md:items-start", className)}>
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className="min-w-0">
        <div className="min-w-0 font-medium">{value}</div>
        {description ? <div className="mt-1 text-sm/relaxed text-muted-foreground">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 justify-start gap-2 md:justify-end">{actions}</div> : null}
    </div>
  );
}
