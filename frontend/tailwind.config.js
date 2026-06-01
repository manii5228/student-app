/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

// Custom Palettes based on provided hex colors
const vtuRed = {
  50: '#fdf3f3', 100: '#fbe4e4', 200: '#f6c3c4', 300: '#ef9a9b', 400: '#e56466',
  500: '#d5393c', 600: '#a91f23', 700: '#a22125', 800: '#861f23', 900: '#701e22', 950: '#3d0c0e'
};

const vtuNavy = {
  50: '#f4f5f9', 100: '#e7eaf2', 200: '#cacee1', 300: '#a4abc8', 400: '#7883ab',
  500: '#586392', 600: '#444c76', 700: '#383e60', 800: '#2f3451', 900: '#22346c', 950: '#1b1d2e'
};

const vtuBlue = {
  50: '#f0f8fd', 100: '#dfeffa', 200: '#b9e0f5', 300: '#7bc7ec', 400: '#36aae2',
  500: '#1491ce', 600: '#0080c7', 700: '#0066a3', 800: '#035687', 900: '#084870', 950: '#052e4a'
};

const vtuTerra = {
  50: '#fcf5f4', 100: '#fae7e4', 200: '#f4cbc5', 300: '#eba59b', 400: '#e07667',
  500: '#d2503e', 600: '#c9503d', 700: '#a53e2e', 800: '#893528', 900: '#722f25', 950: '#3d150f'
};

const vtuCyan = {
  50: '#f0fbfd', 100: '#daf5fa', 200: '#b7ecf5', 300: '#83dfef', 400: '#46cae3',
  500: '#27bcd1', 600: '#1c91a5', 700: '#1a7587', 800: '#1a5e6d', 900: '#194f5c', 950: '#0a343e'
};

const mattePlate = {
  50: '#f8f9fa', 100: '#f1f3f5', 200: '#e9ecef', 300: '#dee2e6', 400: '#ced4da',
  500: '#adb5bd', 600: '#868e96', 700: '#495057', 800: '#343a40', 900: '#212529', 950: '#1a1d20'
};

module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Completely override colors to strictly enforce the palette
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: mattePlate[900], // No pure black, use matte plate
      
      // Grays/Mattes
      slate: mattePlate,
      gray: mattePlate,
      zinc: mattePlate,
      neutral: mattePlate,
      stone: mattePlate,
      
      // Primary defined colors
      red: vtuRed,
      rose: vtuRed,
      pink: vtuRed,
      
      orange: vtuTerra,
      amber: vtuTerra,
      
      blue: vtuBlue,
      sky: vtuBlue,
      
      cyan: vtuCyan,
      teal: vtuCyan,
      emerald: vtuCyan,
      green: vtuCyan,
      yellow: vtuCyan, // Map yellow to cyan (no yellow allowed)
      
      indigo: vtuNavy,
      purple: vtuNavy,
      violet: vtuNavy,
      
      app: {
        bg: mattePlate[50],
        blue: vtuBlue[100],
        purple: vtuNavy[100],
        dark: mattePlate[900],
        accent: vtuBlue[600],
      }
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
