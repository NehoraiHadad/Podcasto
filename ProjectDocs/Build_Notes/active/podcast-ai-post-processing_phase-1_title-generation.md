# Build Notes: Podcast AI Post-Processing

## Task Objective
Implement an AI-driven post-processing system that runs after podcast audio files are created to:
1. Generate a title and summary for each podcast episode using the transcript file
2. Create a custom episode image based on the generated summary, maintaining consistent style

## Current State Assessment
- The current system has a 10-minute periodic check to determine if a podcast episode generation has completed
- When an episode is complete, the audio file is stored in S3 and the status is updated to "completed"
- Transcript files are also uploaded to S3 but aren't used after upload
- The podcast episode doesn't have a dynamically generated title or summary
- No custom images are created for episodes automatically

## Future State Goal
- After podcast audio creation is complete, the system will automatically:
  1. Retrieve the transcript file from S3
  2. Use the Google Gemini AI API to generate a relevant title and summary
  3. Use the Gemini API to generate a custom image based on the summary
  4. Update the episode in the database with the new title, summary, and image URL
- The entire process will be modular, allowing for future changes to the AI provider
- The design will be consistent with the project's functional programming approach

## Implementation Plan
1. **Setup AI Integration Module**
   - [x] Create a modular AI service layer in `lib/ai/index.ts`
   - [x] Implement provider-specific modules (starting with Gemini) for:
     - [x] Title and summary generation
     - [x] Image generation
   - [x] Set up common interfaces and types for AI services

2. **Build Episode Post-Processing System**
   - [x] Create a post-processing handler in `lib/services/post-processing.ts`
   - [x] Implement S3 transcript file retrieval function
   - [x] Add episode metadata update functions
   - [x] Implement image storage and URL generation

3. **Integrate with Status Checker**
   - [x] Modify `app/api/cron/episode-checker/route.ts` to trigger post-processing on status change
   - [x] Add logging and error handling for post-processing steps
   - [x] Implement retries for failed AI operations

4. **Add Configuration**
   - [x] Add environment variables for API keys
   - [x] Create configuration options for AI settings
   - [x] Implement feature flags for enabling/disabling individual features

5. **Testing & Validation**
   - [ ] Create unit tests for AI service modules
   - [ ] Test end-to-end flow with sample transcripts
   - [ ] Verify image generation quality and consistency
   - [ ] Validate database updates

6. **Documentation & Deployment**
   - [x] Update project documentation with new features
   - [x] Add configuration guide for AI providers
   - [ ] Document sample prompts and settings
   - [ ] Deploy to staging for final validation

## Progress Update (March 30, 2023)
We have implemented the core functionality for AI-driven post-processing of podcast episodes:

1. Created a modular AI integration layer with:
   - Common interfaces for different AI providers
   - Implementation for Google Gemini API (with support for title/summary generation and image creation)
   - Factory pattern for future provider extensions

2. Developed a post-processing service that:
   - Retrieves transcript files from S3
   - Sends content to AI for title and summary generation
   - Creates and uploads episode images
   - Updates episode metadata in the database

3. Modified the episode checker to:
   - Detect completed episodes
   - Trigger post-processing workflow
   - Update episode status to "processed" when complete
   - Handle errors gracefully

4. Added configuration through environment variables:
   - Toggle for enabling/disabling post-processing
   - API keys for Gemini integration
   - S3 credentials for file operations

Next steps include:
- Implementing comprehensive testing
- Creating example prompts for different podcast styles
- Deploying to staging environment for validation

## Completion Criteria
- System automatically processes completed episodes to add:
  - A contextually relevant title based on transcript content
  - A concise summary capturing key points from the episode
  - A visually appealing episode image that reflects the content
- All components are modular and can be easily extended or replaced
- Comprehensive error handling ensures reliability
- Documentation provides clear guidance for configuration and customization 