import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        dedupe: ["react", "react-dom"], // Visualizer : the visualizer bundle imports react but is symlinked from outside this project. Without dedupe, Vite loads a second React copy so that hooks crash. dedupe forces one copy from Portal's node_modules.
    },
});

//
