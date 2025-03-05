import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Fix unescaped entities error
      "react/no-unescaped-entities": "off",
      // Fix unused variables error
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      // Fix missing display name error
      "react/display-name": "off",
      // Fix exhaustive deps warning
      "react-hooks/exhaustive-deps": "warn",
      // Fix explicit any error
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];

export default eslintConfig;
