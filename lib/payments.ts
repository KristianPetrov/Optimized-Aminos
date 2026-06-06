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
