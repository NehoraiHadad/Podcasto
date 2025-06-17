# Build Notes: Dynamic Speaker Roles

**Build Title**: Dynamic Speaker Roles  
**Phase**: 1  
**Task Group**: Content-Aware Role Selection  
**Date**: 2025-01-15

## Task Objective
Implement a dynamic system where AI analyzes content and determines appropriate speaker roles instead of using fixed roles. The system should:
1. Analyze content context (news, tech, finance, etc.)
2. Determine optimal speaker2_role based on content type
3. Use Gemini structured output to ensure consistent role selection
4. Maintain speaker1 as fixed host while speaker2 varies by content

## Current State Assessment
- Fixed speaker roles defined in podcast configuration
- speaker1_role is consistent (Host)
- speaker2_role is static per podcast (Expert, Analyst, etc.)
- No content analysis for role optimization
- Voice randomization works but roles don't adapt to content

## Future State Goal
- AI analyzes content before script generation
- speaker2_role dynamically selected based on content type
- Structured response ensures valid role selection
- Role selection influences script style and voice characteristics
- Better content-role matching improves podcast quality

## Implementation Plan

### Step 1: Create Content Analysis Service
- [x] Create new service `ContentAnalyzer` in `services/content_analyzer.py`
- [x] Implement content analysis using Gemini with structured output
- [x] Define role categories and their descriptions
- [x] Create response schema for content analysis

### Step 2: Define Role Categories and Mapping
- [x] Create comprehensive role categories (News Anchor, Tech Expert, Financial Analyst, etc.)
- [x] Map content types to appropriate speaker roles
- [x] Define role descriptions for better script generation
- [x] Ensure roles work well with available voice genders

### Step 3: Integrate Content Analysis into Pipeline
- [x] Update `AudioGenerationHandler` to call content analyzer
- [x] Pass analyzed role to script generator
- [x] Update voice selection to consider dynamic roles
- [x] Maintain backward compatibility with fixed roles

### Step 4: Update Script Generation
- [x] Modify script generator to use dynamic roles
- [x] Enhance prompts with role-specific context
- [x] Ensure role information is included in voice-aware prompts
- [x] Test with various content types

## Implementation Summary ✅ COMPLETED

### What Was Implemented:

1. **Content Analysis Service**:
   - Created `ContentAnalyzer` class with Gemini structured output
   - 12 content categories (news, technology, finance, politics, sports, health, science, entertainment, business, education, lifestyle, general)
   - 12 corresponding speaker roles with expertise mapping
   - Confidence scoring and reasoning for role selection

2. **Dynamic Role Integration**:
   - Updated `AudioGenerationHandler` to analyze content before script generation
   - Dynamic `speaker2_role` selection based on content type
   - Content analysis metadata passed to script generator
   - Response includes content analysis results

3. **Enhanced Script Generation**:
   - Script generator receives content analysis information
   - Role-specific prompts that emphasize expertise areas
   - Voice-aware script generation with dynamic roles
   - Improved content-role matching for better podcast quality

4. **Structured Output Implementation**:
   - Used Gemini's `response_schema` with `propertyOrdering`
   - Enum-based content type classification
   - Confidence scoring for analysis quality
   - Error handling with fallback to default roles

### Key Features:
- **Content-Aware**: AI analyzes content to determine optimal speaker roles
- **Expertise Matching**: Tech content gets Tech Expert, finance gets Financial Analyst, etc.
- **Structured Responses**: Reliable role selection using Gemini's structured output
- **Voice Integration**: Dynamic roles work with voice randomization system
- **Backward Compatible**: Existing fixed roles still work if content analysis fails

### Testing Recommendations:
- Test with different content types (news, tech, finance, etc.)
- Verify role selection accuracy and confidence scores
- Test Hebrew content analysis
- Validate voice-role combinations work properly
- Check fallback behavior when analysis fails

## Notes
- Use Gemini's structured output with response_schema for reliable role selection
- Consider content language when selecting roles
- Maintain consistency within same podcast series
- Test with Hebrew content specifically
- Ensure role selection works with voice gender requirements 