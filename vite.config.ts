import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const portable = mode === "portable";
  return {
    // The standalone HTML keeps its offline/local behavior, independent of hosted accounts.
    define: portable ? {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(""),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(""),
    } : undefined,
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
