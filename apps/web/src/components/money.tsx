import { formatMoney } from "@/lib/format";

export function Money({ amountZloty }: { amountZloty: number | null | undefined }) {
  return <span>{formatMoney(amountZloty)}</span>;
}
