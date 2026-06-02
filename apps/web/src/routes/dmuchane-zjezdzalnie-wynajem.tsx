import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo-landing";

export const Route = createFileRoute("/dmuchane-zjezdzalnie-wynajem")({
  component: () => <SeoLanding path="/dmuchane-zjezdzalnie-wynajem" />,
});
