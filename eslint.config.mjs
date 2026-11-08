import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Icons: Untitled UI only (@untitledui/icons). Block other icon libraries.
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["lucide-react", "react-icons", "react-icons/*", "@heroicons/*", "@radix-ui/react-icons", "@tabler/icons-react", "@phosphor-icons/*", "react-feather"],
              message: "Use @untitledui/icons — Mishkah uses Untitled UI icons only.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
