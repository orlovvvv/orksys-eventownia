import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo-landing";

export const Route = createFileRoute("/maszyna-do-waty-cukrowej-wynajem")({
  component: () => <SeoLanding path="/maszyna-do-waty-cukrowej-wynajem" />,
});
