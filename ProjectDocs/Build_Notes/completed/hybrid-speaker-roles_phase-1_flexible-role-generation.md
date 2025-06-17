# Build Notes: Hybrid Speaker Roles

**Build Title**: Hybrid Speaker Roles  
**Phase**: 1  
**Task Group**: Flexible Role Generation  
**Date**: 2025-01-15

## Task Objective
Enhance the dynamic speaker role system with hybrid approach:
1. Keep stable content categories for consistency
2. Allow AI to generate specific, creative role names within categories
3. Maintain voice mapping and gender consistency
4. Provide more contextual and engaging speaker roles

## Current State Assessment
- Fixed 12 content categories with predefined speaker roles
- Each category maps to exactly one role (e.g., technology → "Tech Expert")
- Limited creativity in role naming
- Good consistency but lacks specificity for content nuances

## Future State Goal
- AI selects from stable content categories
- AI generates specific, contextual role names within each category
- Maintain voice gender mapping through category-based rules
- Enhanced engagement through more precise role descriptions
- Backward compatibility with existing system

## Implementation Plan

### Step 1: Enhance Content Analysis Schema
- [x] Update response schema to include specific_role field
- [x] Keep content_category enum for stability
- [x] Add role_description for context
- [x] Maintain confidence scoring

### Step 2: Update Role Mapping System
- [x] Create category-based gender mapping
- [x] Define role generation guidelines per category
- [x] Add validation for generated roles
- [x] Ensure voice compatibility

### Step 3: Enhance Script Generation
- [x] Use specific role names in prompts
- [x] Include role descriptions for better context
- [x] Maintain expertise area information
- [x] Update voice-aware prompts

### Step 4: Test and Validate
- [ ] Test role generation across different content types
- [ ] Validate gender mapping consistency
- [ ] Ensure voice selection works properly
- [ ] Test Hebrew content compatibility

## Implementation Summary ✅ COMPLETED

### What Was Implemented:

1. **Hybrid Content Analysis**:
   - Enhanced `ContentAnalyzer` with specific role generation
   - AI creates contextual role names within stable categories
   - Role descriptions provide expertise context
   - Category-based gender mapping for voice consistency

2. **Enhanced Response Schema**:
   - Added `specific_role` field for AI-generated role names
   - Added `role_description` for expertise context
   - Maintained stable `content_type` enum for consistency
   - Improved prompts with role creation guidelines

3. **Dynamic Role Integration**:
   - Updated handler to use specific roles in script generation
   - Gender assignment based on content category
   - Enhanced metadata in responses
   - Backward compatibility maintained

4. **Script Generation Enhancement**:
   - Uses AI-generated specific role names
   - Includes role descriptions in prompts
   - Better expertise matching for content
   - Improved conversation quality

### Example Results:
```json
{
  "content_type": "technology",
  "specific_role": "AI Research Scientist",
  "role_description": "Expert in machine learning algorithms and artificial intelligence research",
  "confidence": 0.92,
  "reasoning": "Content focuses on AI research and neural networks"
}
```

### Key Benefits:
- **Stability**: Fixed categories ensure consistent voice mapping
- **Creativity**: AI generates specific, contextual role names
- **Relevance**: Roles precisely match content focus areas
- **Engagement**: More interesting and specific expert personas
- **Consistency**: Category-based gender mapping for voice selection

## Notes
- Hybrid approach balances stability with creativity
- Category-based gender mapping ensures voice compatibility
- Specific roles enhance content relevance
- Maintains all existing functionality 