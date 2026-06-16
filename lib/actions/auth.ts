"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn, signOut } from "@/auth";
import { sendEmailVerification, sendPasswordReset } from "@/lib/email";
import { createAuthToken, consumeAuthToken } from "@/lib/tokens";

export type AuthFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  unverifiedEmail?: string;
} | null;

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[0-9]/, "Include at least one number.")
  .regex(/[a-zA-Z]/, "Include at least one letter.");

const registerSchema = z
  .object({
    name: z.string().min(2, "Please enter your name."),
    email: z.string().email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function registerUser(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    if (!existing[0].emailVerifiedAt) {
      const token = await createAuthToken(
        existing[0].id,
        "email_verification",
      );
      await sendEmailVerification(normalizedEmail, token);
      redirect(
        `/verify-email/check?email=${encodeURIComponent(normalizedEmail)}`,
      );
    }
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "customer",
    })
    .returning({ id: users.id });

  const token = await createAuthToken(user.id, "email_verification");
  await sendEmailVerification(normalizedEmail, token);

  redirect(`/verify-email/check?email=${encodeURIComponent(normalizedEmail)}`);
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function authenticate(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const redirectTo =
    (formData.get("redirectTo") as string | null) || "/account";

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  if (!user.emailVerifiedAt) {
    return {
      error: "Please verify your email before signing in.",
      unverifiedEmail: normalizedEmail,
    };
  }

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return null;
}

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (user) {
    const token = await createAuthToken(user.id, "password_reset");
    await sendPasswordReset(normalizedEmail, token);
  }

  return {
    success:
      "If an account exists for that email, we've sent password reset instructions.",
  };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const userId = await consumeAuthToken(
    parsed.data.token,
    "password_reset",
  );

  if (!userId) {
    return {
      error: "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));

  redirect("/login?reset=success");
}

export async function resendVerificationEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  const [user] = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (user && !user.emailVerifiedAt) {
    const token = await createAuthToken(user.id, "email_verification");
    await sendEmailVerification(normalizedEmail, token);
  }

  return {
    success:
      "If your account needs verification, we've sent a new confirmation email.",
  };
}

export type VerifyEmailResult =
  | { status: "success" }
  | { status: "invalid" }
  | { status: "missing" };

export async function verifyEmailToken(
  rawToken: string,
): Promise<VerifyEmailResult> {
  const userId = await consumeAuthToken(rawToken, "email_verification");

  if (!userId) {
    return { status: "invalid" };
  }

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, userId));

  return { status: "success" };
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
