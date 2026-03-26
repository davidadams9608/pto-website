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

      {/* ── PDF viewer (desktop: embedded iframe, mobile: open button) ── */}
      <div className="hidden md:flex justify-center bg-[#FAFAFA] p-8">
        <div className="w-full max-w-[900px] overflow-hidden rounded-lg bg-[#52525B] shadow-lg">
          <iframe
            src={`${fileUrl}#view=FitH`}
            title={title}
            className="block h-[calc(100vh-180px)] w-full border-0"
            allow="fullscreen"
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 bg-[#FAFAFA] px-6 py-12 md:hidden">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
            <path d="M14 2v6h6"/>
          </svg>
        </div>
        <p className="text-center text-sm font-semibold text-[#09090B]">{title}</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#1B6DC2] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F4F8A]"
        >
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M1 10v2.5h12V10"/><path d="M7 1v8"/><path d="M3.5 5.5L7 9l3.5-3.5"/>
          </svg>
          Open PDF
        </a>
        <p className="text-xs text-[#71717A]">Opens in your device&apos;s PDF viewer</p>
      </div>
    </>
  );
}
