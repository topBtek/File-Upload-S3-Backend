/**
 * Generate unique IDs for file records
 * In production, you might want to use UUIDs or database-generated IDs
 */

export function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
