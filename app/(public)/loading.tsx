export default function HomeLoading() {
  return (
    <>
      {/* ── Hero skeleton ── */}
      <div className="border-b border-[#E4E4E7] bg-white">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-8 px-6 pb-[2.5rem] pt-[3.5rem] md:grid-cols-2 md:gap-[5rem] md:px-8 md:pb-[5rem] md:pt-[5.5rem]">
          <div className="animate-pulse">
            <div className="mb-6 h-6 w-40 rounded-full bg-zinc-200" />
            <div className="mb-3 h-10 w-full rounded-lg bg-zinc-200" />
            <div className="mb-5 h-10 w-4/5 rounded-lg bg-zinc-200" />
            <div className="mb-2 h-4 w-full rounded bg-zinc-200" />
            <div className="mb-2 h-4 w-full rounded bg-zinc-200" />
            <div className="mb-8 h-4 w-3/4 rounded bg-zinc-200" />
            <div className="flex gap-3">
              <div className="h-10 w-36 rounded-[7px] bg-zinc-200" />
              <div className="h-10 w-32 rounded-[7px] bg-zinc-200" />
            </div>
          </div>

          {/* Right: mini cards */}
          <div className="hidden animate-pulse flex-col gap-4 md:flex">
            <div className="h-[220px] rounded-[16px] bg-zinc-200" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[80px] rounded-[12px] bg-zinc-200" />
              <div className="h-[80px] rounded-[12px] bg-zinc-200" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Events section skeleton ── */}
      <div className="bg-white px-6 py-[3rem] md:px-8 md:py-[5rem]">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-8 flex items-end justify-between animate-pulse">
            <div>
              <div className="mb-2 h-3 w-20 rounded bg-zinc-200" />
              <div className="h-8 w-48 rounded-lg bg-zinc-200" />
            </div>
            <div className="h-4 w-16 rounded bg-zinc-200" />
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
