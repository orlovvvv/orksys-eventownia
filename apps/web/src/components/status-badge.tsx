import { Badge } from "@orksys-eventownia/ui/components/badge";

const destructive = new Set(["declined", "cancelled", "failed", "expired", "refunded"]);
const positive = new Set(["confirmed", "confirmed_deposit_paid", "confirmed_paid", "paid", "completed", "sent"]);

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <Badge variant="outline">brak</Badge>;
  const variant = destructive.has(status)
    ? "destructive"
    : positive.has(status)
      ? "default"
      : "secondary";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}
