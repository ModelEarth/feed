import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

// Define __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "src/assets/*", dest: "assets" }, // Copy assets to widget/assets
      ],
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/feedplayer.js"),
      name: "FeedPlayer",
      fileName: () => `feedplayer.js`,
      formats: ["es", "umd"],
    },
    outDir: "widget",
    rollupOptions: {
      external: ["react", "react-dom"],
      input: "./index.html",
      output: {
          entryFileNames: 'assets/[name].js', // remove hash for easier referencing
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  base: "",
});
