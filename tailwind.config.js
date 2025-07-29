/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4CAF50',
          dark: '#388E3C',
          light: '#81C784',
        },
        secondary: {
          DEFAULT: '#2196F3',
          dark: '#1976D2',
          light: '#64B5F6',
        },
        accent: {
          DEFAULT: '#FFC107',
          dark: '#FFA000',
          light: '#FFD54F',
        },
        background: '#FFFFFF',
        surface: '#F5F5F5',
        error: '#F44336',
        success: '#4CAF50',
        warning: '#FF9800',
        info: '#2196F3',
        text: {
          primary: '#212121',
          secondary: '#757575',
          disabled: '#9E9E9E',
          hint: '#BDBDBD',
        },
      },
    },
  },
  plugins: [],
};
