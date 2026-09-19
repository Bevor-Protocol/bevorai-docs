import { createFileRoute } from "@tanstack/react-router";
import { DocsView } from "@/components/docs-view";
import { loadDocsRoute } from "@/server/loader";

export const Route = createFileRoute("/docs/$")({
  loader: ({ params }) => loadDocsRoute(params._splat?.split("/").filter(Boolean) ?? []),
  component: () => <DocsView data={Route.useLoaderData()} />,
});
