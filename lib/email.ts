import { Resend } from "resend";
import type { Order, OrderItem } from "@/db/schema";
import { formatPrice } from "./format";
import { buildVenmoLink, formatVenmoHandle } from "./payments";
import { getTrackingUrl } from "./tracking";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM || "Optimized Aminos <orders@optimizedaminos.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const ZELLE = process.env.NEXT_PUBLIC_ZELLE_RECIPIENT || "payments@optimizedaminos.com";
const VENMO = process.env.NEXT_PUBLIC_VENMO_HANDLE || "OptimizedAminos";

type OrderWithItems = Order & { items: OrderItem[] };

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping email "${subject}" to ${to}`,
    );
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}

function layout(heading: string, body: string): string {
  return `
  <div style="margin:0;padding:0;background:#05070d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
      <div style="text-align:center;padding-bottom:24px;">
        <span style="font-size:22px;font-weight:700;letter-spacing:0.04em;color:#e8c879;">OPTIMIZED<span style="color:#f4f6fb;"> AMINOS</span></span>
      </div>
      <div style="background:linear-gradient(180deg,#0b1322 0%,#070b14 100%);border:1px solid rgba(232,200,121,0.25);border-radius:16px;overflow:hidden;">
        <div style="height:3px;background:linear-gradient(90deg,#e8c879,#bb8e3a);"></div>
        <div style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#f4f6fb;font-weight:600;">${heading}</h1>
          <div style="color:#aeb7c7;font-size:15px;line-height:1.6;">${body}</div>
        </div>
      </div>
      <p style="text-align:center;color:#5b6577;font-size:12px;margin-top:24px;line-height:1.6;">
        For Research Use Only. Not for human or veterinary use. Products are intended
        strictly for in-vitro laboratory research and development.<br/>
        &copy; ${new Date().getFullYear()} Optimized Aminos.
      </p>
    </div>
  </div>`;
}

function itemsTable(order: OrderWithItems): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#dfe5ef;">
          ${item.name} <span style="color:#7c8699;">× ${item.quantity}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#dfe5ef;text-align:right;">
          ${formatPrice(item.unitPriceCents * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      ${rows}
      <tr>
        <td style="padding:10px 0;color:#aeb7c7;">Subtotal</td>
        <td style="padding:10px 0;color:#aeb7c7;text-align:right;">${formatPrice(order.subtotalCents)}</td>
      </tr>
      ${
        order.discountCents > 0
          ? `<tr>
        <td style="padding:4px 0;color:#5dd4a3;">Discount${order.referralCode ? ` (${order.referralCode})` : ""}</td>
        <td style="padding:4px 0;color:#5dd4a3;text-align:right;">−${formatPrice(order.discountCents)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding:4px 0;color:#aeb7c7;">Shipping</td>
        <td style="padding:4px 0;color:#aeb7c7;text-align:right;">${order.shippingCents === 0 ? "FREE" : formatPrice(order.shippingCents)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#e8c879;font-weight:700;font-size:17px;">Total</td>
        <td style="padding:10px 0;color:#e8c879;font-weight:700;font-size:17px;text-align:right;">${formatPrice(order.totalCents)}</td>
      </tr>
    </table>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:12px 24px;background:linear-gradient(90deg,#e8c879,#cda34f);color:#05070d;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">${label}</a>`;
}

export async function sendOrderConfirmation(order: OrderWithItems) {
  const payInstructions =
    order.paymentMethod === "zelle"
      ? `<p>Please send <strong style="color:#e8c879;">${formatPrice(order.totalCents)}</strong> via <strong>Zelle</strong> to:</p>
         <p style="font-size:18px;color:#f4f6fb;background:rgba(232,200,121,0.08);border:1px solid rgba(232,200,121,0.25);border-radius:10px;padding:14px;text-align:center;">${ZELLE}</p>`
      : `<p>Please send <strong style="color:#e8c879;">${formatPrice(order.totalCents)}</strong> via <strong>Venmo</strong> to:</p>
         <p style="font-size:18px;color:#f4f6fb;background:rgba(232,200,121,0.08);border:1px solid rgba(232,200,121,0.25);border-radius:10px;padding:14px;text-align:center;">${formatVenmoHandle(VENMO)}</p>
         <p style="text-align:center;margin-top:8px;">
           <a href="${buildVenmoLink(VENMO, order.totalCents, order.reference)}" style="display:inline-block;padding:12px 24px;background:#3D95CE;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">Pay ${formatPrice(order.totalCents)} with Venmo</a>
         </p>
         <p style="font-size:12px;color:#7c8699;text-align:center;">This link pre-fills the amount and your order reference in the Venmo note.</p>`;

  const body = `
    <p>Thank you for your order. We've reserved your items and are awaiting payment.</p>
    <p style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px 16px;">
      Order reference: <strong style="color:#f4f6fb;">${order.reference}</strong>
    </p>
    ${payInstructions}
    <p style="color:#7c8699;font-size:13px;">Include your order reference <strong>${order.reference}</strong> in the payment note so we can match your payment quickly. Orders are processed once payment is confirmed.</p>
    ${itemsTable(order)}
    ${button("View your order", `${SITE_URL}/account`)}
  `;
  await send(order.email, `Order ${order.reference} received — payment pending`, layout("Order received", body));
}

export async function sendPaymentReceived(order: OrderWithItems) {
  const body = `
    <p>We've confirmed your payment for order <strong style="color:#f4f6fb;">${order.reference}</strong>. Your order is now being prepared for shipment.</p>
    ${itemsTable(order)}
    <p>We'll send another email with tracking details as soon as it ships.</p>
    ${button("View your order", `${SITE_URL}/account`)}
  `;
  await send(order.email, `Payment confirmed for order ${order.reference}`, layout("Payment confirmed", body));
}

export async function sendOrderShipped(order: OrderWithItems) {
  const trackingUrl = getTrackingUrl(order.carrier, order.trackingNumber);
  const trackingNumberHtml = trackingUrl
    ? `<a href="${trackingUrl}" style="color:#e8c879;font-weight:700;text-decoration:underline;">${order.trackingNumber}</a>`
    : `<strong style="color:#e8c879;">${order.trackingNumber}</strong>`;
  const tracking = order.trackingNumber
    ? `<p style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px 16px;">
         Carrier: <strong style="color:#f4f6fb;">${order.carrier ?? "—"}</strong><br/>
         Tracking number: ${trackingNumberHtml}
       </p>
       ${trackingUrl ? `<p style="text-align:center;">${button("Track your package", trackingUrl)}</p>` : ""}`
    : "";
  const body = `
    <p>Great news — order <strong style="color:#f4f6fb;">${order.reference}</strong> has shipped!</p>
    ${tracking}
    ${itemsTable(order)}
    ${button("View your order", `${SITE_URL}/account`)}
  `;
  await send(order.email, `Order ${order.reference} has shipped`, layout("Your order is on the way", body));
}

export async function sendOrderCancelled(order: OrderWithItems) {
  const body = `
    <p>Your order <strong style="color:#f4f6fb;">${order.reference}</strong> has been cancelled. If you believe this was a mistake or have questions, simply reply to this email.</p>
    ${itemsTable(order)}
  `;
  await send(order.email, `Order ${order.reference} cancelled`, layout("Order cancelled", body));
}

export async function sendAdminNewOrder(order: OrderWithItems) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return;
  const body = `
    <p>A new order has been placed and is awaiting payment.</p>
    <p style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px 16px;">
      Reference: <strong style="color:#f4f6fb;">${order.reference}</strong><br/>
      Customer: ${order.shippingAddress.fullName} (${order.email})<br/>
      Method: ${order.paymentMethod.toUpperCase()}
    </p>
    ${itemsTable(order)}
    ${button("Open admin dashboard", `${SITE_URL}/admin`)}
  `;
  await send(adminEmail, `New order ${order.reference} — ${formatPrice(order.totalCents)}`, layout("New order received", body));
}
