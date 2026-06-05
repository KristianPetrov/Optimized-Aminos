import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink-800">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="text-lg font-semibold tracking-[0.06em]">
              <span className="text-gradient-gold">OPTIMIZED</span>
              <span className="text-foam"> AMINOS</span>
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">
              Precision-manufactured research peptides for the modern laboratory.
              Every vial is supplied strictly for in-vitro experimentation and
              scientific development.
            </p>
            <div className="mt-5 rounded-xl border border-gold/20 bg-gold/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
                Research Use Only
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-mist">
                Products are not intended for human or veterinary use, diagnosis,
                treatment, or the prevention of any disease. Not a drug,
                supplement, or food.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foam">
              Catalog
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-mist">
              <li>
                <Link href="/store" className="hover:text-gold">
                  All Peptides
                </Link>
              </li>
              <li>
                <Link href="/science" className="hover:text-gold">
                  The Science
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-gold">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foam">
              Legal & Compliance
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-mist">
              <li>
                <Link href="/compliance" className="hover:text-gold">
                  Research Use Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gold">
                  Terms of Sale
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-gold">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 text-xs text-faint sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Optimized Aminos. All rights
            reserved.
          </p>
          <p className="text-center sm:text-right">
            By using this site you confirm you are a qualified researcher and
            agree to the Research Use Only terms.
          </p>
        </div>
      </div>
    </footer>
  );
}
