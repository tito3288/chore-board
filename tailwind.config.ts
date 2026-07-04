import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "var(--cb-cream)",
          2: "var(--cb-cream-2)",
          3: "var(--cb-cream-3)",
        },
        ink: {
          DEFAULT: "var(--cb-ink)",
          soft: "var(--cb-ink-soft)",
        },
        muted: "var(--cb-muted)",
        green: {
          DEFAULT: "var(--cb-green)",
          soft: "var(--cb-green-soft)",
          mist: "var(--cb-green-mist)",
        },
        amber: {
          DEFAULT: "var(--cb-amber)",
          deep: "var(--cb-amber-deep)",
          soft: "var(--cb-amber-soft)",
        },
        rose: {
          DEFAULT: "var(--cb-rose)",
          soft: "var(--cb-rose-soft)",
        },
        border: "var(--cb-border)",
      },
      fontFamily: {
        heading: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 55px rgba(67, 54, 32, 0.08)",
        lift: "0 16px 36px rgba(47, 93, 58, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
