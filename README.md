# S3 File Upload Backend – Cloudinary-style with Presigned URLs

A production-ready Node.js + TypeScript backend service that implements secure, direct-to-S3 file uploads using AWS presigned URLs. This service enables clients to upload files directly to S3 without routing traffic through your server, reducing bandwidth costs and improving upload performance.

## 🚀 Features

- **Direct Client-to-S3 Uploads**: Generate presigned PUT URLs for direct uploads, eliminating server bandwidth usage
- **Multiple File Type Support**: Configurable MIME type validation for images, videos, documents, and audio files
- **Metadata Attachment**: Attach custom metadata (userId, tags, public/private flags, descriptions) to uploads
- **Secure Presigned URLs**: Short-lived, secure presigned URLs for both uploads (PUT) and downloads (GET)
- **Private File Access**: Generate temporary presigned GET URLs for private bucket access
- **File Management**: List files with pagination and filtering, delete files with authentication
- **Post-Upload Processing**: Webhook/callback endpoint for post-upload tasks (thumbnails, transcoding, etc.)
- **JWT Authentication**: Optional JWT-based authentication for protected endpoints
- **Input Validation**: Zod schemas for request validation
- **Structured Logging**: Pino-based structured logging with pretty printing in development
- **Error Handling**: Consistent JSON error responses with proper HTTP status codes
- **Health Checks**: Built-in health check endpoint for monitoring
- **Comprehensive Tests**: Jest + Supertest test suite covering core functionality

## 🛠 Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (ESM modules)
- **Framework**: Express.js
- **AWS SDK**: @aws-sdk/client-s3 v3, @aws-sdk/s3-request-presigner
- **Validation**: Zod
- **Logging**: Pino + pino-http + pino-pretty
- **Authentication**: jsonwebtoken (JWT)
- **Testing**: Jest + ts-jest + Supertest
- **Code Quality**: ESLint + TypeScript strict mode

## 📋 Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **AWS Account**: With an S3 bucket configured
- **AWS Credentials**: Access key ID and secret access key with S3 permissions
- **npm** or **yarn**: Package manager

### Required AWS Permissions

Your AWS IAM user/role needs the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

## 🏗 Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd File-Upload-S3-Backend-1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` and fill in your AWS credentials and configuration:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
S3_PREFIX=uploads/

# Presigned URL Configuration
PRESIGN_EXPIRY_SECONDS=900
PRESIGN_GET_EXPIRY_SECONDS=3600

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRY_SECONDS=86400

# File Upload Configuration
MAX_FILE_SIZE_MB=100
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/quicktime,video/x-msvideo
ALLOWED_DOCUMENT_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain
ALLOWED_AUDIO_TYPES=audio/mpeg,audio/wav,audio/ogg,audio/webm

# Logging
LOG_LEVEL=info
```

### 4. Configure S3 Bucket CORS

For direct client-to-S3 uploads, configure CORS on your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["*"], // Restrict to your domain in production
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 5. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 🏗 Project Structure

```
.
├── src/
│   ├── config/          # Configuration (environment variables)
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Express middlewares (auth, validation, error handling)
│   ├── routes/          # Route definitions
│   ├── schemas/         # Zod validation schemas
│   ├── services/        # Business logic (S3 service, file service)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utilities (logger, errors, ID generation)
│   └── index.ts         # Application entry point
├── tests/               # Test files
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
└── README.md
```

## Support

- telegram: https://t.me/topBtek
- twitter:  https://x.com/topBtek
