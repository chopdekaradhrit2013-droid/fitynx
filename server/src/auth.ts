import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import type { SafeUser, UserRecord } from "./types.js";

const JWT_SECRET = process.env.JWT_SECRET || "fitynx_super_secret_jwt_key_2026";
const JWT_EXPIRES_IN = "30d";

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function generateToken(user: UserRecord | SafeUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const user = db.getUserById(payload.id);
  if (!user) {
    res.status(401).json({ error: "User no longer exists" });
    return;
  }

  req.user = user;
  next();
}

