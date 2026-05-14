/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Kesin / fiili (actual) — yeşil tonları
        actual: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
        },
        // Tahmin (estimated) — kehribar / turuncu tonları
        estimated: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
        },
        // Anomali / kritik uyarı — kırmızı tonları
        anomaly: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
        },
        // Nötr bilgi — slate
        info: {
          50: "#f8fafc",
          100: "#f1f5f9",
          500: "#64748b",
          700: "#334155",
        },
      },
    },
  },
  plugins: [],
};
