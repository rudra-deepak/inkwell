import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
         <div className="group flex items-center gap-2 font-serif text-lg font-bold tracking-tight">
  <span className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent transition-all duration-500 group-hover:from-emerald-400 group-hover:to-cyan-400">
    Inkwell
  </span>
  <span className="relative flex h-1.5 w-1.5">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
  </span>
</div>

<div className="mt-4 max-w-md border-l-2 border-neutral-100 pl-4 transition-colors hover:border-indigo-500 dark:border-neutral-800">
  <p className="text-xs font-normal leading-relaxed tracking-wide text-neutral-500 dark:text-neutral-400">
    A local-first blogging platform.
  </p>
  <p className="mt-1 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
    By{' '}
    <a 
      href="http://port-rudra.netlify.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative inline-block font-bold lowercase tracking-normal text-neutral-800 dark:text-neutral-200"
    >
      <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
        @rudra_deepak
      </span>
      <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 group-hover:w-full" />
    </a>
  </p>
</div>



        </div>
        <nav className="flex flex-wrap items-center gap-4 text-xs">
          <Link className="hover:text-white" href="/">
            Feed
          </Link>
          <Link className="hover:text-white" href="/new">
            Write
          </Link>
          <Link className="hover:text-white" href="/dashboard">
            Dashboard
          </Link>
        
        </nav>
      </div>
    </footer>
  );
}
