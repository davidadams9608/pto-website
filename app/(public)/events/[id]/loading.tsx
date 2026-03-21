export default function EventDetailLoading() {
  return (
    <>
      {/* ── Back bar skeleton ── */}
      <div className="border-b-2 border-[#BFDBFE] bg-[#EFF6FF] px-5 py-[0.65rem] md:border-b-0 md:border-l-4 md:border-l-[#1B6DC2] md:px-8 md:py-3">
        <div className="mx-auto max-w-[1100px]">
          <div className="h-4 w-28 animate-pulse rounded bg-blue-100" />
        </div>
      </div>

      {/* ── Content skeleton ── */}
      <div className="px-5 pb-8 pt-6 md:px-8 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_380px] md:gap-12">

            {/* Left: event info */}
            <div className="animate-pulse">
              <div className="mb-6 h-9 w-3/4 rounded-lg bg-zinc-200 md:h-11" />
              <div className="mb-8 flex flex-col gap-3 border-b border-[#E4E4E7] pb-8">
                <div className="h-4 w-48 rounded bg-zinc-200" />
                <div className="h-4 w-56 rounded bg-zinc-200" />
                <div className="h-4 w-64 rounded bg-zinc-200" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="h-4 w-full rounded bg-zinc-200" />
                <div className="h-4 w-full rounded bg-zinc-200" />
                <div className="h-4 w-4/5 rounded bg-zinc-200" />
                <div className="mt-2 h-4 w-full rounded bg-zinc-200" />
                <div className="h-4 w-3/4 rounded bg-zinc-200" />
              </div>
            </div>

            {/* Right: card skeleton */}
            <div className="animate-pulse rounded-[12px] border border-[#E4E4E7] p-6 md:rounded-[16px] md:p-8">
              <div className="mb-5 flex items-center justify-between border-b border-[#E4E4E7] pb-4">
                <div className="h-5 w-36 rounded bg-zinc-200" />
                <div className="h-5 w-20 rounded-full bg-zinc-200" />
              </div>
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="h-10 w-10 rounded-full bg-zinc-200" />
                <div className="h-5 w-36 rounded bg-zinc-200" />
                <div className="h-4 w-48 rounded bg-zinc-200" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
