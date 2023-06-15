import { defineConfig } from 'tsup';

if (!process.env.NODE_ENV){
    process.env.NODE_ENV = "production";
}

const isProd = process.env.NODE_ENV.toLowerCase() === "production";

export default defineConfig({
	name: 'servo',
	entry: [
        "./src/index.ts",
        "./src/sdk/index.ts",
		"./src/cli/index.ts",
		"./src/internal/client.ts"
    ],
	outDir: 'dist',
	dts: isProd,
	splitting: false,
	sourcemap: !isProd,
	clean: true,
	external: [],
	format: ['esm', 'cjs'],
	platform: 'node',
	target: 'node16',
	watch: !isProd,
	skipNodeModulesBundle: true,
	shims: true
});
