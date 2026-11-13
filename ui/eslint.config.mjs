import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // Vendored Untitled UI components keep their upstream form.
    files: ["src/components/base/**", "src/components/application/**", "src/components/foundations/**"],
    rules: { "@next/next/no-img-element": "off" },
  },
]);

export default eslintConfig;
