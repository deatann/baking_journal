// Shown instantly while the next page loads, so taps never feel dead.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 pl-[62px] md:pl-0" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded-xl bg-crust-100" />
      <div className="-ml-[62px] space-y-3 md:ml-0">
        <div className="h-12 rounded-2xl bg-crust-100" />
        <div className="h-28 rounded-3xl bg-crust-100" />
        <div className="h-28 rounded-3xl bg-crust-100" />
        <div className="h-28 rounded-3xl bg-crust-100" />
      </div>
    </div>
  );
}
