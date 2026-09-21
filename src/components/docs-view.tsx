import { type Serialized, useFumadocsLoader } from "fumadocs-core/source/client";
import { Suspense, use } from "react";
import { OpenAPIPage } from "@/components/api-page";
import { useMDXComponents } from "@/components/mdx";
import { SearchProvider } from "@/components/search/provider";
import { DocsLayout } from "@/layouts/docs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "@/layouts/docs/page";
import { docs } from "@/lib/docs";
import { baseOptions } from "@/lib/layout.shared";
import type { serverLoader } from "@/server/loader";

export type DocsLoaderData = Awaited<ReturnType<typeof serverLoader>>;

const Content = ({ path }: { path: string }) => {
  const page = docs.getPage(path);
  if (!page) throw new Error(`Unknown page: ${path}`);

  const { toc } = use(page.load());
  const MDX = page.body;

  return (
    <DocsPage
      toc={toc}
      tableOfContent={{
        style: "clerk",
      }}
    >
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <DocsBody>
        <MDX components={useMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
};

const PageContent: React.FC<{ page: Serialized<DocsLoaderData> }> = ({ page }) => {
  if (page.type === "openapi") {
    return (
      <DocsPage full footer={{ enabled: false }}>
        <DocsBody>
          <OpenAPIPage {...page.props} />
        </DocsBody>
      </DocsPage>
    );
  }

  return <Content path={page.path} />;
};

export const DocsView: React.FC<{ data: DocsLoaderData }> = ({ data }) => {
  const page = useFumadocsLoader(data);

  return (
    <SearchProvider>
      <DocsLayout {...baseOptions()} tree={page.pageTree}>
        <Suspense>
          <PageContent page={page} />
        </Suspense>
      </DocsLayout>
    </SearchProvider>
  );
};
