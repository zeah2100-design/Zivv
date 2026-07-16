import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(username: string, email: string, password: string, birthDate: Date) {
  const hashedPassword = await hashPassword(password);
  
  const [user] = await db.insert(users).values({
    username,
    email,
    password: hashedPassword,
    birthDate,
    displayName: username,
  }).returning();
  
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export function validateAge(birthDate: Date): boolean {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
}

// Simple session management using cookies (in production, use proper JWT or session library)
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
