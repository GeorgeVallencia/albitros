import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = "insurmap_session";

type Session = {
  sub: string;          // user id
  email: string;
  role: string;
};

export async function createJWT(session: Session) {
  return await new SignJWT(session as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);
}

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as Session;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionCookie() {
  const cookieStore = cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/** Server-side helper: get the session (or null) */
export async function getServerSession() {
  const token = getSessionCookie();
  if (!token) return null;
  try {
    return await verifyJWT(token);
  } catch {
    return null;
  }
}
