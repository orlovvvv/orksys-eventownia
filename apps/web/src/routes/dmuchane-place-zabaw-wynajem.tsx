import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo-landing";

export const Route = createFileRoute("/dmuchane-place-zabaw-wynajem")({
  component: () => <SeoLanding path="/dmuchane-place-zabaw-wynajem" />,
});
