import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  esbuild: {
    jsx: "automatic", // react/jsx-runtime 변환
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      formats: ["es"],
      fileName: () => "acs-react.js",
    },
    rollupOptions: {
      // react / 코어는 소비자가 제공 — 번들에 포함하지 않음
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@axbis/acs-core",
        "three",
      ],
    },
  },
  plugins: [
    dts({
      entryRoot: fileURLToPath(new URL("./src", import.meta.url)),
    }),
  ],
});
