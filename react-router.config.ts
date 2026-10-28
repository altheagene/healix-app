import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // The frontend deploys to Vercel, which sets VERCEL=1 while building. The preset
  // lets Vercel split routes into functions. Off elsewhere, so a local build still
  // produces build/server/index.js for `npm start`.
  presets: process.env.VERCEL ? [vercelPreset()] : [],
} satisfies Config;
