import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // AWS Configuration
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET_NAME: z.string().min(1),
  S3_PREFIX: z.string().default('uploads/'),

  // Presigned URL Configuration
  PRESIGN_EXPIRY_SECONDS: z.coerce.number().int().positive().default(900),
  PRESIGN_GET_EXPIRY_SECONDS: z.coerce.number().int().positive().default(3600),

  // Server Configuration
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // JWT Configuration
  JWT_SECRET: z.string().min(1).default('change-me-in-production'),
  JWT_EXPIRY_SECONDS: z.coerce.number().int().positive().default(86400),

  // File Upload Configuration
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(100),
  ALLOWED_IMAGE_TYPES: z.string().default('image/jpeg,image/png,image/gif,image/webp,image/svg+xml'),
  ALLOWED_VIDEO_TYPES: z.string().default('video/mp4,video/webm,video/quicktime,video/x-msvideo'),
  ALLOWED_DOCUMENT_TYPES: z.string().default('application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'),
  ALLOWED_AUDIO_TYPES: z.string().default('audio/mpeg,audio/wav,audio/ogg,audio/webm'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

const env = parseEnv();

// Parse comma-separated MIME type strings into arrays
export const config = {
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucketName: env.S3_BUCKET_NAME,
    prefix: env.S3_PREFIX.endsWith('/') ? env.S3_PREFIX : `${env.S3_PREFIX}/`,
  },
  presign: {
    uploadExpirySeconds: env.PRESIGN_EXPIRY_SECONDS,
    getExpirySeconds: env.PRESIGN_GET_EXPIRY_SECONDS,
  },
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expirySeconds: env.JWT_EXPIRY_SECONDS,
  },
  upload: {
    maxFileSizeBytes: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    maxFileSizeMB: env.MAX_FILE_SIZE_MB,
    allowedMimeTypes: {
      images: env.ALLOWED_IMAGE_TYPES.split(',').map((t) => t.trim()),
      videos: env.ALLOWED_VIDEO_TYPES.split(',').map((t) => t.trim()),
      documents: env.ALLOWED_DOCUMENT_TYPES.split(',').map((t) => t.trim()),
      audio: env.ALLOWED_AUDIO_TYPES.split(',').map((t) => t.trim()),
    },
    // Combined list of all allowed types
    allAllowedTypes: [
      ...env.ALLOWED_IMAGE_TYPES.split(',').map((t) => t.trim()),
      ...env.ALLOWED_VIDEO_TYPES.split(',').map((t) => t.trim()),
      ...env.ALLOWED_DOCUMENT_TYPES.split(',').map((t) => t.trim()),
      ...env.ALLOWED_AUDIO_TYPES.split(',').map((t) => t.trim()),
    ],
  },
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;
