import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // 모노레포 DX: 코어를 dist 빌드 없이 소스로 직접 사용
      // (배포 패키지 검증은 npm pack + 별도 앱에서 수행)
      "@axbis/acs-core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url)
      ),
    },
  },
});
