// A person's chibi, or a coloured circle with their initial until they upload one.
const COLORS = ["#f6d98c", "#f4b9a6", "#b9d1b0", "#a9cfe6", "#d3c0e6"];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export default function Avatar({
  name,
  url,
  size = 40,
  className = "",
}: {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-full border-[1.5px] border-line bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span
          className="grid h-full w-full place-items-center font-extrabold text-ink"
          style={{ background: colorFor(name), fontSize: Math.round(size * 0.42) }}
          aria-label={name}
        >
          {(name.trim()[0] ?? "?").toUpperCase()}
        </span>
      )}
    </span>
  );
}
