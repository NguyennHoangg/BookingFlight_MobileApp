/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        booking: {
          primary: "#2864FF",
          ink: "#12263F",
          muted: "#718099",
          line: "#DFE5F1",
          background: "#F7F8FF",
          soft: "#EEF4FF",
          danger: "#DF495A",
        },
        primary: {
          DEFAULT: "#0064D2",
          dark: "#004B9B",
          light: "#E8F2FF",
        },
      },
    },
  },
  plugins: [],
};
