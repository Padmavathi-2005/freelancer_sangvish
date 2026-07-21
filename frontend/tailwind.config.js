module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'teal-750': '#0f766e', // Matches brand's deep teal color
      },
      fontSize: {
        'xxs': '0.625rem', // 10px font size
      }
    }
  }
};
