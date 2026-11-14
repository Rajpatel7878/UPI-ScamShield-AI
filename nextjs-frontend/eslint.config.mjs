import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Data fetching on mount and the auth bootstrap update state from an
      // effect by design. This React Compiler recommendation does not model
      // async request lifecycles, so keep it off rather than rewriting the
      // existing request layer around a cache library.
      "react-hooks/set-state-in-effect": "off",
      // The router compatibility layer must accept React Router props such as
      // `state` that Next.js does not consume. Underscore-prefixed bindings
      // mark those intentionally ignored API arguments.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
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
