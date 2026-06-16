/**
 * Builds a deep link to the carrier's tracking page for a tracking number.
 * Returns null when the carrier is unknown so callers can fall back to text.
 */
export function getTrackingUrl(
  carrier: string | null,
  trackingNumber: string | null,
): string | null {
  if (!carrier || !trackingNumber) return null;
  const num = encodeURIComponent(trackingNumber.trim());

  switch (carrier.trim().toLowerCase()) {
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
    case "ups":
      return `https://www.ups.com/track?tracknum=${num}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
    case "dhl":
      return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${num}`;
    default:
      return null;
  }
}
