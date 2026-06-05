import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-semibold text-gradient-gold">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-foam">
        Page not found
      </h1>
      <p className="mt-2 text-mist">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-gradient-to-r from-gold to-gold-deep px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
      >
        Return home
      </Link>
    </div>
  );
}
