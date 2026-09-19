import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { docs } from "@/lib/docs";
import { source } from "@/lib/source";

export const serverLoader = createServerFn({ method: "GET" })
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    const pageTree = await source.serializePageTree(source.getPageTree());

    if (page.type === "openapi") {
      return {
        type: "openapi" as const,
        title: page.data.title,
        description: page.data.description,
        pageTree,
        props: page.data.getOpenAPIPageProps(),
      };
    }

    return {
      type: "docs" as const,
      path: page.path,
      pageTree,
    };
  });

/** Route loader for both `/docs` and `/docs/$`, warming the MDX chunk before render. */
export const loadDocsRoute = async (slugs: string[]) => {
  const data = await serverLoader({ data: slugs });

  if (data.type === "docs") {
    await docs.getPage(data.path)?.preload();
  }

  return data;
};
