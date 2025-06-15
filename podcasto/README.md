# Podcasto - AI-Powered Podcast Generator

Podcasto transforms news content from Telegram channels into professional podcasts, delivered directly to your inbox daily.

## Features

- **Daily News Updates**: Receive the latest news from leading Telegram channels, processed into a convenient podcast format for easy listening.
- **Multi-language Support**: Listen to podcasts in your preferred language, including Hebrew, English, and additional languages.
- **Direct Email Delivery**: Get podcasts delivered straight to your inbox, eliminating the need for manual searching or downloading.
- **User Authentication**: Sign in using your Google account or email and password.
- **Personalized Content**: Customize your podcast feed based on your interests and preferred news sources.
- **Cross-platform Accessibility**: Listen on any device with a modern web browser or email client.
- **Automated Episode Processing**: Background service monitors podcast generation status, ensuring timely delivery and handling any failures gracefully.

## Technology Stack

- **Next.js 15 with RSC**: Advanced React framework with Server Components support for optimal performance.
- **Supabase**: Backend-as-a-Service for secure data storage, user authentication, and real-time updates.
- **Tailwind CSS**: Utility-first CSS framework for rapid and modern UI development.
- **TypeScript**: JavaScript-based programming language with strong typing for enhanced code quality and developer experience.
- **Shadcn UI**: Component library for consistent and accessible user interfaces.

## Installation

1. Clone the repository:

```bash
git clone https://gitlab.com/your-username/Podcasto.git
cd Podcasto
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with Supabase settings (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Supabase Setup

1. Create an account on [Supabase](https://supabase.com/).
2. Create a new project.
3. Enable the authentication service and configure desired providers (email/password, Google).
4. Copy the URL and Anon Key from the project settings to your `.env.local` file.
5. Set up the database schema according to the `ProjectDocs/contexts/databaseSchema.md` document.

## Project Structure

```
├── app/                  # Application pages
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Dashboard pages
│   ├── api/              # API routes
│   ├── podcasts/         # Podcast pages
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── shared/           # Shared components
│   ├── features/         # Feature-specific components
│   └── ui/               # UI components (Shadcn)
├── lib/                  # Libraries and services
│   ├── supabase/         # Supabase client and services
│   ├── hooks/            # Custom React hooks
│   ├── constants/        # Global constants
│   └── utils/            # Utility functions
└── public/               # Static files
```

## Development

- **Code Style**: The project follows functional programming principles with TypeScript for type safety.
- **Component Structure**: Components are modular, reusable, and follow the RORO (Receive an Object, Return an Object) pattern.
- **State Management**: Server components are used where possible, with client-side state managed by Zustand when necessary.
- **Documentation**: Code is self-documenting with descriptive variable names and comments where needed.

## License

This project is distributed under the MIT License. See the `LICENSE` file for more details.

## Troubleshooting

### S3 Upload Permissions

If you encounter an error like this:
```
Error saving generated image: AccessDenied: User: arn:aws:iam::XXXX:user/Podcasto-s3-access is not authorized to perform: s3:PutObject on resource
```

You need to update your IAM user permissions:

1. Go to AWS IAM console: https://console.aws.amazon.com/iam/
2. Find the user mentioned in the error (e.g., Podcasto-s3-access)
3. Attach the policy from the `aws-s3-policy.json` file or create a new inline policy with the following content:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3BucketOperations",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::podcasto-podcasts"
    },
    {
      "Sid": "AllowS3ObjectOperations",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::podcasto-podcasts/*"
    }
  ]
}
```

4. Save the policy and try uploading again.

### Server Actions Body Size Limit

If you see this error when submitting large forms:
```
Error: Body exceeded 1 MB limit.
```

This is fixed by updating the Next.js configuration in `next.config.ts` to increase the body size limit:

```typescript
serverActions: {
  bodySizeLimit: '4mb',
},
```

## Environment Variables Setup

### Required Environment Variables for Vercel:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AWS Configuration for Lambda Integration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AUDIO_GENERATION_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT/podcasto-audio-generation-dev

# S3 Bucket Configuration
S3_BUCKET_NAME=podcasto-storage
```

### AWS Lambda Setup:
1. Deploy the Lambda using SAM CLI from `/Lambda/audio-generation-lambda/`
2. Configure AWS Secrets Manager with GEMINI_API_KEY
3. Update AUDIO_GENERATION_QUEUE_URL in Vercel environment variables

## Architecture Flow:
1. **Vercel Dashboard** → User triggers episode generation
2. **Telegram Lambda** → Collects content and saves to S3
3. **SQS Queue** → Message passing between services
4. **Audio Generation Lambda** → Processes with 15-minute timeout
5. **S3 Storage** → Final audio files

## Development Commands:
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Deploy Lambda
cd Lambda/audio-generation-lambda
sam deploy --guided
```
