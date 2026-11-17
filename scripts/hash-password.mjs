// Prints a password hash for ADMIN_PASSWORD_HASH (same format as apps/web/lib/password.ts).
// Usage: pnpm admin:password "your password"   (then paste the output into apps/web/.env.local)
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: pnpm admin:password "your password"');
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
// ":" separators, not "$": Next.js expands $NAME inside .env values.
console.log(["scrypt", salt.toString("base64url"), hash.toString("base64url")].join(":"));
