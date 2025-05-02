/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/templates/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a73e8',
          light: '#4285f4',
          dark: '#174ea6',
          ocean: '#0066cc',
          wave: '#00a1ff',
          sky: '#e8f0fe',
        },
        accent: {
          DEFAULT: '#fbbc04',
          sand: '#f4b400',
          coral: '#ff7043',
          shell: '#ffab91',
        },
        background: {
          DEFAULT: '#ffffff',
          light: '#f8f9fa',
          ocean: '#e8f0fe',
        },
        text: {
          DEFAULT: '#333333',
          secondary: '#666666',
          tertiary: '#999999',
          ocean: '#0066cc',
        },
        border: {
          DEFAULT: '#e0e0e0',
          hover: '#c0c0c0',
          ocean: '#4285f4',
        },
        error: '#d93025',
        success: '#0f9d58',
        warning: '#f4b400',
        info: '#4285f4',
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'sans-serif'],
        serif: ['Noto Serif TC', 'serif'],
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'ocean': '0 4px 6px -1px rgba(0, 102, 204, 0.1), 0 2px 4px -1px rgba(0, 102, 204, 0.06)',
      },
      backgroundImage: {
        'ocean-gradient': 'linear-gradient(to right, #0066cc, #00a1ff)',
        'wave-pattern': "url('/images/wave-pattern.svg')",
      },
    },
  },
  plugins: [],
} 