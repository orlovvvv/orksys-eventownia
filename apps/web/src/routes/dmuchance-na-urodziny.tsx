import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo-landing";

export const Route = createFileRoute("/dmuchance-na-urodziny")({
  component: () => <SeoLanding path="/dmuchance-na-urodziny" />,
});
