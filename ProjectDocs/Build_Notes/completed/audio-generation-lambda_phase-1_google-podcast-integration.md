# Audio Generation Lambda Improvement - Phase 1: Google Podcast Integration

## Task Objective
Refactor and improve the audio-generation-lambda to use the official Google Gemini 2.5 Flash TTS with multi-speaker capabilities, replacing the current implementation with the proven Google podcast generation code.

## Current State Assessment
- Existing audio-generation-lambda uses google-generativeai library with custom TTS implementation
- Lambda connects to SQS queue from telegram-lambda for episode processing
- Current implementation has empty `google_podcast_generator.py` service
- Uses older Google TTS approach rather than the new Gemini 2.5 Flash TTS
- Template.yaml references non-existent or outdated AWS resources

## Future State Goal
- Implement Google Gemini 2.5 Flash TTS with multi-speaker podcast generation
- Clean up irrelevant code and files
- Update dependencies to use `google-genai` instead of `google-generativeai`
- Ensure proper SQS integration with telegram-lambda
- Optimize for AWS Lambda environment with proper audio file handling
- Update AWS resources to reflect current needs

## Implementation Plan

### Step 1: Dependencies and Configuration
- [x] Update requirements.txt to use `google-genai` library
- [x] Remove unused dependencies (google-cloud-texttospeech, pydub)
- [ ] Update environment variables for Gemini 2.5 Flash TTS

### Step 2: Core Google Podcast Generator Service
- [x] Implement complete GooglePodcastGenerator service based on official Google code
- [x] Add audio conversion utilities (convert_to_wav, parse_audio_mime_type)
- [x] Implement streaming audio generation with proper file handling
- [x] Add multi-speaker voice configuration support

### Step 3: Audio Generation Handler Updates
- [x] Update handler to use new GooglePodcastGenerator service
- [x] Implement proper audio streaming and S3 upload
- [x] Add error handling for streaming audio generation
- [x] Update episode processing logic for new TTS approach

### Step 4: Code Cleanup
- [x] Remove irrelevant files and code
- [x] Clean up unused client dependencies  
- [x] Optimize handler for Lambda cold start performance
- [x] Ensure proper memory and timeout configuration

### Step 5: AWS Resources Review
- [x] Audit current AWS resources (Lambda, SQS, S3, Secrets Manager)
- [x] Update template.yaml to reflect actual resource needs
- [x] Remove references to non-existent resources
- [x] Verify SQS integration with telegram-lambda

### Step 6: Testing and Validation
- [x] Create local test script for audio generation
- [ ] Test audio generation with multi-speaker content (requires API key)
- [ ] Validate SQS message processing
- [ ] Test S3 upload functionality  
- [ ] Performance testing for Lambda execution time

## Implementation Summary

### Completed Changes
1. **Dependencies Updated**: Replaced `google-generativeai` with `google-genai` library
2. **Core Service Implemented**: Complete GooglePodcastGenerator with streaming audio, WAV conversion, and multi-speaker support
3. **Handler Refactored**: Updated to use new service with proper content preparation and audio processing
4. **AWS Configuration Optimized**: Increased memory to 2048MB, timeout to 15 minutes, SQS visibility timeout to 16 minutes
5. **Documentation Updated**: README reflects new Google TTS integration approach
6. **Testing Infrastructure**: Created local test script for validation

### Key Features
- **Streaming Audio Generation**: Memory-efficient processing using Google's streaming API
- **Multi-Speaker Support**: Configurable voice assignments (default: Zephyr, Puck)
- **WAV Conversion**: Automatic conversion from various audio formats to WAV
- **Conversational Script**: Intelligent preparation of Telegram messages into podcast dialogue
- **Error Handling**: Comprehensive error handling with status updates and retry logic

### Next Steps Required
- Set GEMINI_API_KEY in AWS Secrets Manager
- Test with actual Telegram data
- Deploy and validate with real SQS messages
- Performance testing with various episode lengths

## Notes
- Official Google code uses streaming approach which is more memory efficient for Lambda
- Need to maintain SQS integration for telegram-lambda communication
- Focus on podcast-specific audio generation rather than general TTS
- Lambda now optimized for audio processing workloads 