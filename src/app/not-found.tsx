import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-serif text-6xl text-white/20">404</p>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-white">That page went unpublished</h1>
      <p className="mt-3 max-w-md text-sm text-slate-400">
        The post may have been deleted, converted back to a draft, or the link is simply wrong.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="btn-primary">
          Back to the feed
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          Your dashboard
        </Link>
      </div>
    </div>
  );
}
