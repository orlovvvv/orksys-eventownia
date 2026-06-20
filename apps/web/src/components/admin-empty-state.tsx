import { Card, CardContent } from "@orksys-eventownia/ui/components/card";
import type { LucideIcon } from "lucide-react";

export function AdminEmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon />
        </div>
        <div className="text-base font-semibold">{title}</div>
        {description ? <p className="max-w-md text-sm/relaxed text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
