/** Zelle recipient shown at checkout, on order pages, and in emails. */
export const DEFAULT_ZELLE_RECIPIENT = "703-728-9990";

/** Venmo username shown to customers (without a leading "@"). */
export const DEFAULT_VENMO_HANDLE = "east-coast-coaching";

export function getZelleRecipient(): string {
  return process.env.NEXT_PUBLIC_ZELLE_RECIPIENT || DEFAULT_ZELLE_RECIPIENT;
}

export function getVenmoHandle(): string {
  return process.env.NEXT_PUBLIC_VENMO_HANDLE || DEFAULT_VENMO_HANDLE;
}

/**
 * Builds a Venmo payment deep link that pre-fills the recipient, the order
 * total, and a note containing the order reference. Opens the Venmo app on
 * mobile and the web payment flow on desktop.
 *
 * @param handle      Venmo username (with or without a leading "@")
 * @param amountCents Order total in cents
 * @param note        Note for the payment (e.g. the order reference)
 */
export function buildVenmoLink(
  handle: string,
  amountCents: number,
  note: string,
): string {
  const recipient = handle.replace(/^@/, "");
  const amount = (amountCents / 100).toFixed(2);
  const params = new URLSearchParams({
    txn: "pay",
    audience: "private",
    recipients: recipient,
    amount,
    note,
  });
  return `https://venmo.com/?${params.toString()}`;
}

/** Formats a Venmo handle for display, ensuring a single leading "@". */
export function formatVenmoHandle(handle: string): string {
  return `@${handle.replace(/^@/, "")}`;
}
