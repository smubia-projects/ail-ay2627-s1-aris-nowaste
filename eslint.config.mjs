import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

// The API bundle (npm run build:server) and the original Supabase/Telegram code (not deployed) are not linted.
const config = [...nextVitals, ...nextTypeScript, { ignores: ["server/dist/**", "original-supabase/**"] }];
export default config;
