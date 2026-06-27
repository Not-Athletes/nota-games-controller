import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    expiresAt?: number;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}

export type ExtendedSession = DefaultSession & {
  accessToken?: string;
  expiresAt?: number;
  error?: string;
};
