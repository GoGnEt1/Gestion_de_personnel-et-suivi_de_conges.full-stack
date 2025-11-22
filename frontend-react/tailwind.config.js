// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        roboto: ["Roboto", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        lora: ["Lora", "serif"],
      },
    },
  },
  plugins: [],
  variants: {
    extend: {
      before: ["hover", "focus"],
      after: ["hover", "focus"],
    },
  },
};
