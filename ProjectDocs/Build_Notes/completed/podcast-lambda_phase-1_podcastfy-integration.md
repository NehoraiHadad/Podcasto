# Podcast Lambda - Phase 1: Podcastfy Integration

## Task Objective
Integrate the podcastfy library into the podcast-generator Lambda function to enable high-quality podcast generation with proper text-to-speech capabilities.

## Current State Assessment
The podcast-generator Lambda function currently uses a simulated audio generation method that doesn't actually create real audio files. It lacks the ability to generate proper podcasts with text-to-speech capabilities.

## Future State Goal
The podcast-generator Lambda function will use the podcastfy library to generate high-quality podcasts with proper text-to-speech capabilities. It will handle temporary file storage correctly within the Lambda environment and upload the generated audio files to S3.

## Implementation Plan

1. **Set up the Lambda environment for podcastfy**
   - [x] Create a Dockerfile for the podcast-generator Lambda function
   - [x] Install ffmpeg in the Docker container
   - [x] Add podcastfy to the requirements.txt file
   - [x] Configure the Lambda function to use the Docker container

2. **Integrate podcastfy into the Lambda function**
   - [x] Add the podcastfy library to the app.py file
   - [x] Create a new function to generate audio using podcastfy
   - [x] Configure podcastfy to use the /tmp directory for temporary files
   - [x] Add fallback to the original audio generation method if podcastfy fails

3. **Update the Lambda configuration**
   - [x] Increase the Lambda memory to 3GB for podcastfy processing
   - [x] Set the Lambda timeout to 10 minutes
   - [x] Add environment variables for API keys

4. **Test and deploy the Lambda function**
   - [ ] Test the Lambda function locally using SAM
   - [ ] Deploy the Lambda function to AWS
   - [ ] Test the Lambda function in AWS
   - [ ] Monitor the Lambda function for errors and performance issues

5. **Security improvements**
   - [ ] Move API keys from .env file to AWS Secrets Manager
   - [ ] Implement proper authentication for the API Gateway
   - [ ] Configure the Lambda function to be triggered by events from a queue instead of direct API calls

## Notes
- The podcastfy library requires ffmpeg to be installed in the Lambda environment
- The podcastfy library creates temporary files in the /tmp directory
- The Lambda function has a maximum memory of 3GB and a timeout of 10 minutes
- The Lambda function uses the Dockerfile to build the container image
- The Lambda function falls back to the original audio generation method if podcastfy fails 