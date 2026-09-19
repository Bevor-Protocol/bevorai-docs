import { createOpenAPI } from "fumadocs-openapi/server";

export const openapi = createOpenAPI({
  disableCache: true,
  input: {
    bevor: `${process.env.BASE_URL}/openapi.json`,
  },
});
