/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    boxShadow: {
      // don't shift shadows down like Tailwind does by default
      sm: "   0 0 2px 0 var(--tw-shadow-color)",
      DEFAULT:
        "     0 0 3px 0 var(--tw-shadow-color),     0 0 2px -1px var(--tw-shadow-color)",
      md: "   0 0 6px -1px var(--tw-shadow-color),  0 0 4px -2px var(--tw-shadow-color)",
      lg: "   0 0 15px -3px var(--tw-shadow-color), 0 0 6px -4px var(--tw-shadow-color)",
      xl: "   0 0 25px -5px var(--tw-shadow-color), 0 0 10px -6px var(--tw-shadow-color)",
      "2xl": "0 0 50px -12px var(--tw-shadow-color)",
    },
    extend: {
      colors: {
        // current album color
        accent: "#83b5dd",
        // Spotify brand color, see https://developer.spotify.com/documentation/design#using-our-colors
        "spotify-green": "#1db954",
      },
    },
  },
  plugins: [],
}
