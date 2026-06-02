import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo-landing";

export const Route = createFileRoute("/dmuchance-na-festyny")({
  component: () => <SeoLanding path="/dmuchance-na-festyny" />,
});
