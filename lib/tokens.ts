import { createHash, randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { authTokens } from "@/db/schema";

export type TokenType = "email_verification" | "password_reset";

const TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAuthToken(
  userId: string,
  type: TokenType,
): Promise<string> {
  const rawToken = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const hours =
    type === "email_verification"
      ? EMAIL_VERIFICATION_EXPIRY_HOURS
      : PASSWORD_RESET_EXPIRY_HOURS;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  await db
    .delete(authTokens)
    .where(and(eq(authTokens.userId, userId), eq(authTokens.type, type)));

  await db.insert(authTokens).values({ userId, type, tokenHash, expiresAt });

  return rawToken;
}

export async function consumeAuthToken(
  rawToken: string,
  type: TokenType,
): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const [row] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, type),
        gt(authTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) return null;

  await db.delete(authTokens).where(eq(authTokens.id, row.id));

  return row.userId;
}
