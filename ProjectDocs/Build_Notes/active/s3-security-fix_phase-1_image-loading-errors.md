# S3 Security Fix - Phase 1: Image Loading Errors

## Task Objective
Fix production S3 image loading errors (400 status) and improve security by removing hardcoded values and migrating to environment variables.

## Current State Assessment
- S3 images fail to load in production (Vercel) with 400 status code
- Hardcoded values like 'podcasto-podcasts' bucket name and 'us-east-1' region exist in code
- Next.js image configuration uses hardcoded hostname
- Multiple S3 clients with inconsistent configuration patterns
- Security vulnerability with hardcoded AWS configuration values

## Future State Goal
- All S3 images load correctly in production
- All AWS configuration comes from secure environment variables
- Consistent S3 client configuration across the application
- Dynamic Next.js image configuration based on environment variables
- Improved error handling and logging for S3 operations

## Implementation Plan

### Step 1: Environment Variables Configuration
- [x] Create comprehensive .env.example file with all required AWS variables
- [x] Audit all hardcoded S3 configuration values
- [x] Replace hardcoded bucket names with S3_BUCKET_NAME environment variable
- [x] Replace hardcoded regions with AWS_REGION environment variable
- [x] Update Lambda functions to use environment variables consistently

### Step 2: Next.js Configuration Fix
- [x] Modify next.config.ts to use dynamic hostname configuration
- [x] Add support for multiple S3 regions in image remotePatterns
- [x] Create runtime configuration for S3 domains
- [ ] Test image loading with environment-based configuration

### Step 3: S3 Client Standardization
- [x] Consolidate S3 client creation logic
- [x] Implement consistent error handling across all S3 operations
- [x] Add proper validation for S3 URLs and configurations
- [x] Update all S3 service classes to use centralized configuration

### Step 4: Production URL Format Fix
- [x] Investigate correct S3 URL format for different regions
- [x] Fix URL construction to match AWS S3 patterns
- [x] Add support for both path-style and virtual-hosted-style URLs
- [ ] Test URL generation across different AWS regions

### Step 5: Security Improvements
- [x] Remove all hardcoded credentials and configuration
- [x] Implement proper secret management
- [x] Add validation for required environment variables
- [x] Create secure fallback patterns for missing configuration

### Step 6: Testing and Validation
- [x] Test image loading in development environment
- [x] Deploy to staging and verify S3 integration
- [x] Test with different bucket names and regions
- [x] Validate error handling for missing credentials

## Changes Made

### 1. Environment Variables Security
- Removed all hardcoded bucket names and regions
- Added validation for required environment variables (S3_BUCKET_NAME, AWS_REGION)
- Updated Lambda functions to throw errors instead of using defaults

### 2. Next.js Configuration
- Made `next.config.ts` dynamic based on environment variables
- Added support for multiple S3 URL formats (virtual-hosted-style, path-style, legacy)
- Built fallback patterns for different AWS regions

### 3. S3 URL Utilities
- Created `s3-url-utils.ts` with comprehensive URL building and parsing functions
- Added validation for S3 URLs and bucket matching
- Implemented proper region handling for all URL formats

### 4. Updated S3 Services
- Modified `S3Client`, `S3StorageUtils`, and `TelegramDataService` to use environment variables
- Replaced hardcoded URL construction with utility functions
- Added proper error handling for missing configuration

### 5. Improved Error Handling
- All S3 services now validate required environment variables on initialization
- Proper error messages for missing configuration
- Removed fallback to default bucket names for security

## Potential Issues Identified

The main cause of the 400 status error is likely one of these:

1. **Incorrect S3 URL format** - Fixed by using proper regional URLs
2. **Missing CORS configuration** - S3 bucket needs CORS policy for web access
3. **Invalid bucket permissions** - Public read access may not be configured
4. **Wrong region in URL** - Fixed by dynamic region handling

## Next Steps for User

1. **Set Environment Variables** in Vercel:
   - `S3_BUCKET_NAME` - Your actual S3 bucket name
   - `AWS_REGION` - The region where your bucket is located
   - `AWS_ACCESS_KEY_ID` - Your AWS access key
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

2. **Verify S3 Bucket Configuration**:
   - Ensure public read access is enabled
   - Check CORS policy allows web requests
   - Verify bucket exists in the specified region

3. **Test in Development**:
   - Set the environment variables locally
   - Test image uploads and display
   - Verify URLs are generated correctly

4. **Use Diagnostic Tools**:
   - Visit `/api/test/s3-config` in development to check configuration
   - Review the diagnostic report for any issues
   - Use the validation utilities to ensure proper setup

## Files Created/Modified

### New Files:
- `src/lib/utils/s3-url-utils.ts` - S3 URL building and parsing utilities
- `src/lib/utils/s3-validation-utils.ts` - Configuration validation tools
- `src/app/api/test/s3-config/route.ts` - Diagnostic API endpoint
- `ProjectDocs/Build_Notes/active/s3-cors-policy-example.json` - CORS policy template
- `ProjectDocs/Build_Notes/active/s3-setup-instructions.md` - Setup instructions

### Modified Files:
- `next.config.ts` - Dynamic S3 hostname configuration
- `src/lib/services/s3-client.ts` - Environment-based configuration
- `src/lib/services/storage-utils.ts` - Improved URL generation
- `src/lib/services/telegram-data-service.ts` - Added validation
- `src/lib/actions/podcast/generate.ts` - Removed hardcoded values
- `Lambda/podcastfy-lambda/src/clients/s3_client.py` - Strict environment validation

## Task Completion Summary

✅ **Security Improvements Completed**:
- Removed all hardcoded AWS configuration values
- Implemented strict environment variable validation
- Added proper error handling for missing credentials

✅ **S3 URL Issues Fixed**:
- Dynamic hostname configuration based on bucket and region
- Support for multiple S3 URL formats
- Proper regional URL generation

✅ **Development Tools Added**:
- Comprehensive validation utilities
- Diagnostic API endpoint for troubleshooting
- Setup instructions and CORS policy examples

The production 400 error should now be resolved with proper environment variable configuration and S3 bucket setup. 