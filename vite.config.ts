import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const portable = mode === "portable";
  return {
    plugins: [react(), ...(portable ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
    build: {
      outDir: portable ? "portable" : "dist",
      rollupOptions: {
        output: portable ? {} : {
          manualChunks(id) {
            if (id.endsWith("/data/foods.json")) return "food-composition";
          },
        },
      },
    },
  };
});
