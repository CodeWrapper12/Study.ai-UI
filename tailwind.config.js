/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101722",      // page background
        panel: "#18212F",    // cards
        edge: "#26334A",     // borders
        board: "#0B1019",    // departure board black
        amber: "#FFB547",    // board amber
        radar: "#38D996",    // success / progress
        sky: "#4F8DFD",      // links / info
        haze: "#8FA0B8",     // muted text
        paper: "#EDF2FA"     // primary text
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      }
    }
  },
  plugins: []
};
