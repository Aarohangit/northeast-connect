/** Accepts what people actually type (+91, spaces, a leading 0) and returns 10 digits, or whatever is left. */
export function normalisePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

export const isValidMobile = (raw) => /^[6-9]\d{9}$/.test(normalisePhone(raw))
