export const shippingOptions = [
  {
    id: "standard",
    label: "Standard shipping",
    priceCents: 1500,
  },
  {
    id: "overnight",
    label: "Overnight shipping",
    priceCents: 5000,
  },
] as const;

export type ShippingOptionId = (typeof shippingOptions)[number]["id"];

export function getShippingOption(id: ShippingOptionId) {
  return shippingOptions.find((option) => option.id === id);
}

export function getShippingOptionLabel(id?: string | null) {
  return shippingOptions.find((option) => option.id === id)?.label ?? "Shipping";
}
