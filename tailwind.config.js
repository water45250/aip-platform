/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aip: {
          primary: '#7C3AED',
          primaryLight: '#8B5CF6',
          primaryDark: '#6D28D9',
          sidebar: '#1E1E2E',
          sidebarHover: '#2D2D44',
          accent: '#F59E0B',
          success: '#10B981',
          danger: '#EF4444',
          info: '#3B82F6',
          purple: '#A78BFA',
          pink: '#EC4899',
          blue: '#60A5FA',
          cyan: '#22D3EE',
          green: '#34D399',
          yellow: '#FBBF24',
          orange: '#FB923C',
          red: '#F87171',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
