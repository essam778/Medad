import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        // إتاحة كافة دالات الاختبار الخاصة بـ Vitest / Jest
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      // إيقاف خطأ المتغيرات غير المستخدمة أو تحويلها إلى تحذير بسيط فقط
      "no-unused-vars": "warn",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "build/**"],
  },
];
