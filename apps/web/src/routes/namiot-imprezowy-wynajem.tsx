import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo-landing";

export const Route = createFileRoute("/namiot-imprezowy-wynajem")({
  component: () => <SeoLanding path="/namiot-imprezowy-wynajem" />,
});
