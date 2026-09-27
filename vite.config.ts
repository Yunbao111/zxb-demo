import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serves the repository at /zxb-demo/. Local previews keep the
  // normal root path, while Vinext provides the static App Router export.
  base: process.env.GITHUB_ACTIONS === "true" ? "/zxb-demo/" : "/",
  plugins: [
    vinext({
      // Supplying this inline avoids loading the former worker-hosting config.
      nextConfig: {
        output: "export",
        trailingSlash: true,
      },
    }),
  ],
});
