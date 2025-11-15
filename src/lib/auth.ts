// Re-export auth helpers from a single implementation to avoid duplication
export { getJwtSecret, generateToken, verifyToken } from '@/lib/auth/utils';