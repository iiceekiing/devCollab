/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#3B82F6',
          orange: '#F97316',
          red: '#EF4444',
        }
      }
    },
  },
  plugins: [],
}
