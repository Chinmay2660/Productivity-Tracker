import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ["node_modules/**", ".next/**", "out/**"],
  },
  {
    rules: {
      // Data-fetch-on-mount via useEffect is used deliberately throughout this
      // app's pages; it's a single fetch-and-setState, not a cascading-render risk.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
