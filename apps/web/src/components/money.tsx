import { formatMoney } from "@/lib/format";

export function Money({ amountGrosz }: { amountGrosz: number | null | undefined }) {
  return <span>{formatMoney(amountGrosz)}</span>;
}
