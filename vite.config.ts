import { defineConfig, PluginOption } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isWeb = process.env.BUILD_MODE === "web";

  const plugins: PluginOption[] = [react(), tailwindcss()];

  if (!isWeb) {
    plugins.push(
      electron([
        {
          entry: "electron/main.ts",
        },
        {
          entry: "electron/preload.ts",
          onstart(options) {
            options.reload();
          },
        },
      ]),
    );
    plugins.push(renderer());
  }

  return {
    plugins,
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
