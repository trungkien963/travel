/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FBFBFB", 
        primary: "#059669", 
        secondary: "#1C1917", 
        surface: "#FFFFFF",
        text: "#1C1917",
        muted: "#A8A29E",
      },
    },
  },
  plugins: [],
}
