/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./assets/**/*.{html,js}',
  "./views/*.ejs", "./views/**/*.ejs", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        comfortaa: ['"Comfortaa"', 'sans-serif']
      },
      keyframes: {
        'wiggle-right': {
          '0%, 100%': { transform: 'translateX(20px)'},
          '50%': { transform: 'translateX(0)' },
        },
        'wiggle-left': {
          '0%, 100%': { transform: 'translateX(-20px)'},
          '50%': { transform: 'translateX(0)' },
        }
      },
      animation: {
        'wiggle-left': 'wiggle-left 1s ease-in-out infinite',
        'wiggle-right': 'wiggle-right 1s ease-in-out infinite',
      }
    }
  },
  plugins: [
    require('flowbite/plugin')
]
}