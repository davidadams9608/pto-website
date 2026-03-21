export default function EventsLoading() {
  return (
    <>
      {/* ── Page header skeleton ── */}
      <div className="border-b border-[#E4E4E7] bg-white px-8 pb-10 pt-12">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-8">
          <div className="flex-1 animate-pulse">
            <div className="mb-3 h-3 w-28 rounded bg-zinc-200" />
            <div className="mb-3 h-8 w-52 rounded-lg bg-zinc-200" />
            <div className="h-4 w-full max-w-[520px] rounded bg-zinc-200" />
            <div className="mt-2 h-4 w-4/5 max-w-[420px] rounded bg-zinc-200" />
          </div>
          <div className="hidden h-[130px] w-[140px] shrink-0 animate-pulse rounded-lg bg-zinc-100 md:block" />
        </div>
      </div>

      {/* ── Event cards skeleton ── */}
      <div className="px-8 pb-12 pt-10">
        <div className="mx-auto max-w-[1100px]">
          {/* Month heading skeleton */}
          <div className="mb-5 animate-pulse border-b-2 border-[#E4E4E7] pb-3">
            <div className="h-3 w-32 rounded bg-zinc-200" />
          </div>
          <div className="flex flex-col gap-5 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex overflow-hidden rounded-[10px] border border-[#E4E4E7]">
                <div className="min-w-[70px] bg-zinc-100 py-10 md:min-w-[150px]" />
                <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-5 md:px-6">
                  <div className="h-4 w-2/3 rounded bg-zinc-200" />
                  <div className="h-3 w-1/2 rounded bg-zinc-200" />
                </div>
                <div className="flex items-center pr-3 md:pr-5">
                  <div className="h-7 w-16 rounded-[6px] bg-zinc-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
