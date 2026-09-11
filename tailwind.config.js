/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        grace: {50:'#f5faf8',100:'#e8f5f0',200:'#cfe9df',300:'#a8d6c5',400:'#76bca5',500:'#4a9e86',600:'#387f6d',700:'#30675a',800:'#2a544b',900:'#26473f'},
        gold: {400:'#d6b35a',500:'#bf9640',600:'#9f772f'}
      },
      boxShadow: { soft: '0 20px 60px rgba(20,55,45,.10)' }
    }
  },
  plugins: []
};
