import Link from "next/link";

interface FileViewerProps {
  backHref: string;
  backLabel: string;
  title: string;
  meta?: string;
  fileUrl: string;
}

export function FileViewer({ backHref, backLabel, title, meta, fileUrl }: FileViewerProps) {
  return (
    <>
      {/* ── Breadcrumb / document bar ── */}
      <div className="border-b-2 border-[#BFDBFE] bg-[#EFF6FF] px-5 py-[0.65rem] md:border-b-0 md:border-l-4 md:border-l-[#1B6DC2] md:px-8 md:py-3">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex items-center gap-1.5 leading-[1.3] text-[0.8rem] md:text-[0.85rem]">
            <Link
              href={backHref}
              className="flex shrink-0 items-center gap-1 font-semibold text-[#1B6DC2] transition-colors hover:text-[#0F4F8A]"
            >
              <svg
                width="14" height="14" viewBox="0 0 14 14"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 11 L5 7 L9 3"/>
              </svg>
              {backLabel}
            </Link>
            <span className="shrink-0 text-[0.75rem] text-[#71717A]">/</span>
            <span className="min-w-0 truncate font-bold text-[#09090B]">{title}</span>
          </div>
          {meta && (
            <p className="mt-[0.2rem] text-[0.7rem] text-[#71717A] md:text-[0.7rem]">{meta}</p>
          )}
        </div>
      </div>

      {/* ── PDF viewer ── */}
      <div className="flex justify-center bg-[#FAFAFA] p-0 md:p-8">
        <div className="w-full max-w-[900px] overflow-hidden rounded-none bg-[#52525B] shadow-lg md:rounded-lg">
          <iframe
            src={`${fileUrl}#view=FitH`}
            title={title}
            className="block h-[calc(100vh-130px)] w-full border-0 md:h-[calc(100vh-180px)]"
            allow="fullscreen"
          />
        </div>
      </div>
    </>
  );
}
