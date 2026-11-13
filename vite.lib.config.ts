import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { fileURLToPath, URL } from "node:url";

/**
 * 라이브러리 빌드 설정 (데모 앱 빌드와 분리)
 *
 * 사용: npm run build:lib
 * 결과: dist/acs-core.js (ESM), dist/acs-core.umd.cjs (UMD), dist/index.d.ts (타입)
 *
 * - three는 external(소비자가 설치) → 번들에 포함되지 않음
 * - OrbitControls 등 three/addons는 번들에 포함
 */
export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/core/index.ts", import.meta.url)),
      name: "AcsCore",
      formats: ["es", "umd"],
      fileName: (format) => (format === "es" ? "acs-core.js" : "acs-core.umd.cjs"),
    },
    rollupOptions: {
      external: ["three"],
      output: {
        globals: { three: "THREE" },
      },
    },
  },
  plugins: [
    dts({
      entryRoot: fileURLToPath(new URL("./src/core", import.meta.url)),
    }),
  ],
});
