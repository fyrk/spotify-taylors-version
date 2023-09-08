/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // current album color
        "accent": "#83b5dd",
        // Spotify brand color, see https://developer.spotify.com/documentation/design#using-our-colors
        "spotify-green": "#1db954"
      }
    },
  },
  plugins: [],
}
