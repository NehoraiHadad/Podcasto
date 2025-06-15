# Google Gen AI SDK Migration

## Task Objective
Migrate the podcasto Next.js application from the old `@google/generative-ai` SDK to the new `@google/genai` SDK to take advantage of better compatibility with Gemini 2.0 models and new features.

## Current State Assessment
- Application currently uses `@google/generative-ai` version 0.24.1
- Three main provider files implement Gemini AI functionality:
  - `gemini.ts` - Main provider for title/summary generation
  - `gemini-text-generation.ts` - Text generation utilities
  - `image-generator.ts` - Image generation functionality
- All files use dynamic imports and the old SDK pattern with `GoogleGenerativeAI` class

## Future State Goal
- Upgrade to new `@google/genai` SDK
- Migrate all existing functionality to use new API patterns
- Maintain backward compatibility of public interfaces
- Ensure all features continue to work with Gemini 2.0 models

## Implementation Plan

### Step 1: Package Migration ✅
- [x] Install new `@google/genai` package
- [x] Remove old `@google/generative-ai` package
- [x] Update package.json dependencies

### Step 2: Core Provider Migration ✅
- [x] Update `gemini.ts` to use new SDK
- [x] Update `gemini-text-generation.ts` to use new SDK
- [x] Update `image-generator.ts` to use new SDK
- [x] Update import statements and initialization patterns

### Step 3: API Pattern Updates ✅
- [x] Replace `GoogleGenerativeAI` with `GoogleGenAI`
- [x] Update authentication pattern from constructor to config object
- [x] Migrate `getGenerativeModel()` calls to `ai.models.generateContent()`
- [x] Update content generation patterns and response handling

### Step 4: Testing and Validation ✅
- [x] Application builds successfully without errors
- [x] All TypeScript types are valid
- [ ] Test title and summary generation functionality (requires runtime testing)
- [ ] Test text generation functionality (requires runtime testing)
- [ ] Test image generation functionality (requires runtime testing)
- [ ] Verify error handling still works correctly (requires runtime testing)

### Step 5: Configuration Updates ✅
- [x] All model names already using Gemini 2.0 models
- [x] All configuration options properly migrated
- [x] No environment variable changes needed

## Migration Summary

✅ **COMPLETED**: Core SDK migration from `@google/generative-ai` to `@google/genai`

### Key Changes Made:
1. **Package Migration**: Removed old SDK, installed new SDK
2. **Import Updates**: Changed all imports from `GoogleGenerativeAI` to `GoogleGenAI`
3. **Authentication**: Updated initialization from `new GoogleGenerativeAI(apiKey)` to `new GoogleGenAI({ apiKey })`
4. **API Calls**: Migrated from `model.generateContent()` to `ai.models.generateContent()`
5. **Response Handling**: Updated response object access patterns
6. **Error Handling**: Added null-safety checks for response text and image data

### Files Modified:
- `package.json` - Updated dependencies
- `gemini.ts` - Main provider with JSON schema support
- `gemini-text-generation.ts` - Text generation utilities
- `image-generator.ts` - Image generation with new response handling

### Benefits Gained:
- Better compatibility with Gemini 2.0 models
- Access to new features like Live API and Veo (when needed)
- More consistent API patterns
- Enhanced JSON schema support for structured responses

**Next Steps**: Runtime testing to verify all functionality works as expected. 