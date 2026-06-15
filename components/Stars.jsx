export default function Stars({ value = 0, size = "text-base" }) {
  return (
    <span className={`font-mono ${size} text-amber tracking-tight`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= Math.round(value) ? "" : "opacity-25"}>★</span>
      ))}
    </span>
  );
}
