declare module "../services/passwordService" {
  export function hashPassword(plain: string): Promise<string>;
  export function verifyPassword(plain: string, hash: string): Promise<boolean>;
}

declare module "../services/tokenService" {
  type TokenType = "SIGNUP" | "LOGIN";
  export function createVerificationToken(input: { userId: number; type: TokenType }): Promise<string>;
  export function consumeVerificationToken(token: string, type: TokenType): Promise<{ userId: number }>;
}

declare module "../services/emailService" {
  export function sendVerificationLink(input: { email: string; url: string; type: "SIGNUP" | "LOGIN" }): Promise<void>;
}
