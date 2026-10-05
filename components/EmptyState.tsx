export default function EmptyState({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
      <div className="w-48 animate-bob overflow-hidden rounded-[34px_34px_60px_60px/30px_30px_56px_56px] border-[1.5px] border-line bg-white">
        <img src="/brand/scene.jpg" alt="" className="block h-auto w-full" />
      </div>
      <h2 className="mt-2 font-display text-2xl font-bold">{title}</h2>
      <p className="max-w-xs text-sm text-crust-500">{text}</p>
      {children}
    </div>
  );
}
