/**
 * Generates a clean institutional custom username for students
 * Examples: "vansh_842", "rohit_319"
 */
export function generateCustomUsername(
  fullNameOrEmail: string,
  existingUsernames: string[] = [],
  forcedNumber?: number
): string {
  // Extract base prefix
  let base = 'student';
  if (fullNameOrEmail) {
    if (fullNameOrEmail.includes('@')) {
      const emailPrefix = fullNameOrEmail.split('@')[0];
      base = emailPrefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'student';
    } else {
      const parts = fullNameOrEmail.trim().split(/\s+/);
      base = parts[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'student';
    }
  }

  // Keep prefix concise (max 10 chars)
  base = base.slice(0, 10);

  const existingSet = new Set(existingUsernames.map((u) => u.toLowerCase()));

  if (forcedNumber !== undefined) {
    const candidate = `${base}_${forcedNumber}`;
    return candidate;
  }

  // Generate 3 digit random suffix, retry if collision
  for (let attempt = 0; attempt < 50; attempt++) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const candidate = `${base}_${randomSuffix}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  // Fallback with timestamp suffix
  return `${base}_${Date.now().toString().slice(-4)}`;
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const trimmed = username.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Username cannot be empty' };
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  if (trimmed.length > 24) {
    return { isValid: false, error: 'Username must not exceed 24 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { isValid: true };
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 4) {
    return { isValid: false, error: 'Password must be at least 4 characters long' };
  }
  return { isValid: true };
}
