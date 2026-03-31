import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/array-type": "off",
    },
  },
  {
    ignores: [".next/**", "out/**", "dist/**", "node_modules/**"],
  },
];
