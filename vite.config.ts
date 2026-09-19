import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import mdx from "fumadocs-mdx/vite";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	return {
		define: {
			"process.env.BASE_URL": JSON.stringify(env.BASE_URL ?? ""),
		},
		server: {
			port: 3000,
		},
		plugins: [
			...mdx(),
			tanstackStart({
				srcDirectory: "src",
			}),
			nitro(),
			react(),
			tailwindcss(),
		],
		resolve: {
			tsconfigPaths: true,
			alias: {
				// content files live outside the tsconfig scope, so they need the alias here too
				"@/": fileURLToPath(new URL("./src/", import.meta.url)),
				tslib: "tslib/tslib.es6.js",
			},
		},
	};
});
