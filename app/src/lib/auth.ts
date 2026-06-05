import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const FAMILLE_COOKIE = "super8_famille";
const ADMIN_COOKIE = "super8_admin";

// --- Famille ---

export async function setFamilleSession() {
  const cookieStore = await cookies();
  cookieStore.set(FAMILLE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: "/",
  });
}

export async function isFamilleAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(FAMILLE_COOKIE)?.value === "1";
}

export async function clearFamilleSession() {
  const cookieStore = await cookies();
  cookieStore.delete(FAMILLE_COOKIE);
}

// --- Admin ---

export function signAdminToken(): string {
  return jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
}

export async function setAdminSession() {
  const token = signAdminToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: "/",
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return true;
  } catch {
    return false;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
