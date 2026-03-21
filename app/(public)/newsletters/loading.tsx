export default function NewslettersLoading() {
  return (
    <>
      {/* ── Page header skeleton ── */}
      <div className="border-b border-[#E4E4E7] bg-white px-8 pb-10 pt-12">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-8">
          <div className="flex-1 animate-pulse">
            <div className="mb-3 h-3 w-24 rounded bg-zinc-200" />
            <div className="mb-3 h-8 w-44 rounded-lg bg-zinc-200" />
            <div className="h-4 w-full max-w-[540px] rounded bg-zinc-200" />
            <div className="mt-2 h-4 w-4/5 max-w-[440px] rounded bg-zinc-200" />
          </div>
          <div className="hidden h-[165px] w-[220px] shrink-0 animate-pulse rounded-lg bg-zinc-100 md:block" />
        </div>
      </div>

      {/* ── Content skeleton ── */}
      <div className="px-8 pb-16 pt-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_380px]">

            {/* Archive list */}
            <div className="animate-pulse">
              {/* Year heading */}
              <div className="mb-0 border-b-2 border-[#E4E4E7] pb-3">
                <div className="h-3 w-36 rounded bg-zinc-200" />
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-[#E4E4E7] py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-200" />
                    <div>
                      <div className="mb-1.5 h-4 w-40 rounded bg-zinc-200" />
                      <div className="h-3 w-28 rounded bg-zinc-200" />
                    </div>
                  </div>
                  <div className="h-5 w-8 rounded bg-zinc-200" />
                </div>
              ))}
            </div>

            {/* Signup card skeleton */}
            <div className="animate-pulse rounded-[20px] bg-zinc-900 p-10">
              <div className="mb-3 h-7 w-44 rounded-lg bg-zinc-700" />
              <div className="mb-1.5 h-4 w-full rounded bg-zinc-700" />
              <div className="mb-6 h-4 w-4/5 rounded bg-zinc-700" />
              <div className="mb-3 h-10 w-full rounded-lg bg-zinc-700" />
              <div className="mb-3 h-10 w-full rounded-lg bg-zinc-700" />
              <div className="h-10 w-full rounded-lg bg-zinc-700" />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
