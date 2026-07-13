// Hash de contraseñas con Web Crypto (SHA-256 + salt aleatoria por usuario).
// Formato almacenado: v1$<salt-hex>$<hash-hex>
// Los valores sin ese prefijo son contraseñas antiguas en texto plano y se
// migran automáticamente al hash en el primer login correcto.

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(new Uint8Array(digest));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return `v1$${salt}$${await sha256Hex(salt + password)}`;
}

export function isHashed(stored: string): boolean {
  return stored.startsWith('v1$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!isHashed(stored)) return stored === password; // legado: texto plano
  const [, salt, hash] = stored.split('$');
  return (await sha256Hex(salt + password)) === hash;
}
