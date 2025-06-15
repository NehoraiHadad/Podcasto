# Hebrew TTS Improvement - Phase 1: Language and Content Fixes

## Task Objective
Fix Hebrew TTS generation issues with gender agreement and voice selection to create more natural and accurate Hebrew podcast conversations.

## Current State Assessment
- Hebrew TTS uses two similar female voices (Kore, Aoede)
- Script generation doesn't consider speaker gender
- Hebrew conversations have incorrect gender agreement (masculine language with female voices)
- Voice selection is not optimized for language and gender distinction
- API implementation doesn't follow Google's latest best practices

## Future State Goal
- Clear male/female voice distinction for all languages
- Gender-aware script generation with proper Hebrew grammar agreement
- Improved API implementation following Google's documentation
- Natural conversation flow that matches speaker voices and genders
- Enhanced voice selection system with language-specific optimization

## Implementation Plan

### Step 1: Analyze Current TTS Implementation ✅
- [x] Review current Google TTS integration
- [x] Identify voice selection issues
- [x] Document gender agreement problems in Hebrew
- [x] Review Google's latest TTS API documentation

### Step 2: Improve Voice Selection System ✅
- [x] Create voice mapping system for different languages
- [x] Select distinct male/female voices:
  - Hebrew: Algenib (male, gravelly) + Aoede (female, breezy)
  - English: Gacrux (male, mature) + Leda (female, youthful)
  - Default: Gacrux (male) + Leda (female)
- [x] Update GooglePodcastGenerator to accept gender parameters
- [x] Implement language-specific voice configuration

### Step 3: Make Script Generation Gender-Aware ✅
- [x] Update GeminiScriptGenerator to accept speaker gender info
- [x] Create gender-aware prompt templates
- [x] Add Hebrew-specific gender agreement instructions
- [x] Ensure proper verb conjugations and adjectives for each speaker
- [x] Update conversation guidelines to be gender-appropriate

### Step 4: Update Audio Generation Handler ✅
- [x] Pass gender information from podcast config
- [x] Update audio generation call with gender parameters
- [x] Add gender logging for debugging
- [x] Ensure backward compatibility with existing configs

### Step 5: Enhance API Implementation ✅
- [x] Follow Google's best practices for TTS API usage
- [x] Improve temperature settings (0.7 for more consistent speech)
- [x] Use correct response_modalities format ("AUDIO")
- [x] Add better error handling and logging
- [x] Optimize chunking strategy for long content

### Step 6: Test and Validate 
- [ ] Test Hebrew podcast generation with new gender-aware system
- [ ] Verify voice distinction is clear
- [ ] Check Hebrew grammar agreement accuracy
- [ ] Test English and other languages
- [ ] Validate API improvements and error handling

### Step 7: Update Configuration Schema
- [ ] Document new gender configuration options
- [ ] Update default podcast configs to include gender settings
- [ ] Create migration guide for existing podcasts
- [ ] Add validation for gender parameter values

## Key Improvements Made

### Voice Selection Enhancement
- **Language-aware voice mapping**: Different voice pairs for Hebrew, English, and default
- **Gender-distinct voices**: Clear male/female voice selection instead of similar voices
- **Hebrew optimization**: Algenib (gravelly male) + Aoede (breezy female) for better Hebrew pronunciation
- **English optimization**: Gacrux (mature male) + Leda (youthful female) for natural English conversation

### Script Generation Improvements
- **Gender-aware prompts**: Instructions specific to speaker genders
- **Hebrew grammar focus**: Explicit verb conjugation and adjective agreement guidance
- **Natural conversation patterns**: Gender-appropriate reactions and speaking styles
- **Language-specific instructions**: Tailored prompts for Hebrew vs other languages

### API Implementation Enhancements
- **Best practices compliance**: Following Google's latest TTS documentation
- **Improved settings**: Better temperature (0.7) and response modality format
- **Enhanced error handling**: More detailed logging and error messages
- **Chunking optimization**: Better content splitting for long scripts

## Technical Changes Made

### Files Modified:
1. **google_podcast_generator.py**: Added voice configuration system and gender parameters
2. **gemini_script_generator.py**: Added gender-aware script generation
3. **audio_generation_handler.py**: Updated to pass gender information

### New Features:
- Voice configuration mapping by language and gender
- Gender parameter support in all TTS functions
- Hebrew-specific grammar instructions
- Enhanced API configuration following Google's standards

## Next Steps
- Test the improved system with real Hebrew content
- Monitor voice quality and gender agreement accuracy
- Update podcast configurations to include gender settings
- Document the new features for users 