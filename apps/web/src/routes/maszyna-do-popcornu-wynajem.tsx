import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo-landing";

export const Route = createFileRoute("/maszyna-do-popcornu-wynajem")({
  component: () => <SeoLanding path="/maszyna-do-popcornu-wynajem" />,
});
