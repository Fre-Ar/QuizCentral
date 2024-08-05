import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        'uni-blue': '#00a9db',
        'uni-red': '#dc021b',
        'uni-light': '#8d8d8d',
        'uni-grey': '#5c5c5c',
        'uni-black': '#3b3b3b',
        'uni-selec': '#00a9db'
      },
    },
  },
  plugins: [],
};
export default config;
