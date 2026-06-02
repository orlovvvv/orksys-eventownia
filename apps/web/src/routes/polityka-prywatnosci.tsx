import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/polityka-prywatnosci")({
  component: () => <LegalPage type="privacy" />,
});
