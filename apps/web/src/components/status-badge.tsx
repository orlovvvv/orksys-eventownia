import { Badge } from "@orksys-eventownia/ui/components/badge";

import { getStatusLabel, getStatusVariant } from "@/lib/admin-status";

export function StatusBadge({ status }: { status: string | null | undefined }) {
  return <Badge variant={getStatusVariant(status)}>{getStatusLabel(status)}</Badge>;
}
