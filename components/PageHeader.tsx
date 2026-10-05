// Page title with a handwritten tagline. On phones the left side is padded so the
// title clears the floating chibi; on desktop the top bar already holds it.
export default function PageHeader({
  title,
  hand,
  children,
}: {
  title: string;
  hand?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex min-h-[48px] flex-wrap items-center gap-x-3 gap-y-1 pl-[62px] md:pl-0">
      <h1 className="font-display text-[26px] font-bold leading-none text-ink md:text-3xl">{title}</h1>
      {hand && <span className="font-hand text-2xl font-bold leading-none text-peach-500">{hand}</span>}
      {children && <div className="ml-auto">{children}</div>}
    </div>
  );
}
