import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Core React libraries
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react-core';
            }
            
            // React Router
            if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run/router')) {
              return 'vendor-router';
            }

            // UI Libraries (Radix, Lucide, etc.)
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-ui';
            }

            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }

            // Tanstack Query/Virtual
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }

            // Component libraries
            if (id.includes('embla-carousel-react') || id.includes('cmdk') || id.includes('vaul')) {
              return 'vendor-components';
            }

            // Utilities
            if (id.includes('date-fns') || id.includes('recharts') || id.includes('zustand') || id.includes('zod')) {
              return 'vendor-utils';
            }

            return 'vendor-misc';
          }

          // Route-based code splitting
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('.')[0];
            if (pageName) {
              return `page-${pageName}`;
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false,
  },
}));
