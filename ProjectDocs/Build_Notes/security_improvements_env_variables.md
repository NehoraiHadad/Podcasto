# Environment Variables Security Improvements

## Task Objective
Improve security and configuration management by removing hardcoded keys and sensitive data from template files and using environment variables instead.

## Current State Assessment
Currently, sensitive data like API keys, Supabase URLs, and other credentials are hardcoded in several places:
- `template.yaml` files
- `samconfig.toml` files
- `env.json` files

This creates security risks and makes configuration management difficult.

## Future State Goal
All sensitive information and configuration values should be stored in `.env` files only, and template files should reference environment variables instead of containing actual values.

## Implementation Plan

1. ✅ Remove sensitive data from template files
   - [x] Replace hardcoded values with environment variable references in `template.yaml` files
   - [x] Add `NoEcho: true` to sensitive parameters to prevent their values from being displayed

2. ✅ Update samconfig.toml files
   - [x] Update `samconfig.toml` files to use environment variables for parameter overrides
   - [x] Remove any hardcoded sensitive values

3. ✅ Improve env.json configuration
   - [x] Standardize env.json files across all Lambda functions
   - [x] Configure env.json to reference environment variables rather than containing values
   - [x] Add both `Parameters` and function-specific environment variable sections

4. ✅ Update documentation
   - [x] Update README files to explain the new approach
   - [x] Document how to use env.json with SAM CLI
   - [x] Add warnings about not committing .env files

5. ✅ Verify .gitignore configuration
   - [x] Ensure .env files are properly ignored (but allow .env.example files)

## Changes Made

### Lambda/podcastfy-lambda
- Removed hardcoded values from `template.yaml`
- Updated `samconfig.toml` to use environment variables
- Created standardized `env.json` with variable references
- Added SQS_QUEUE_ARN to .env and .env.example
- Updated README with instructions for using env.json

### Lambda/telegram-lambda
- Removed hardcoded values from `template.yml`
- Created standardized `env.json` with variable references
- Updated README with instructions for local development

### Lambda/podcast-scheduler
- Created new `env.json` file with environment variable references
- Updated README to explain the usage of env.json

### General improvements
- Added .env.*.example pattern to .gitignore
- Added warnings about not committing sensitive data
- Ensured consistent formatting and structure across all similar files

## Notes
- This approach simplifies configuration management by centralizing all values in .env files
- It improves security by removing sensitive data from files that might be committed to version control
- It makes local development and deployment more consistent by using the same values everywhere 