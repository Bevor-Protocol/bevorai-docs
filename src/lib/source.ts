import { loader } from "fumadocs-core/source";
import { docs } from "./docs";
import { resolveIcon } from "./icons";
import { openapi } from "./openapi";

export const source = loader(
  {
    docs: docs.toFumadocsSource(),
    openapi: await openapi.staticSource({
      baseDir: "api-reference",
      per: "operation",
      groupBy: "tag",
      meta: false,
    }),
  },
  {
    baseUrl: "/docs",
    icon: resolveIcon,
    plugins: [openapi.loaderPlugin()],
  },
);
