# Voice Differentiation - Phase 1: Distinct Speaker Voices

## Task Objective
Fix the voice selection logic in the audio generation Lambda to ensure that different speakers always get distinct voices, preventing episodes where both speakers use the same voice.

## Current State Assessment
The voice configuration system has several issues:
1. In fixed voice mode (randomize=False), both speakers get the same voice if they have the same gender
2. The voice mapping for Hebrew language has both speakers using voices that sound too similar
3. The randomization logic doesn't ensure voices are different between speakers
4. There's a bug where `Gacrux` is listed as both male and female in the gender mapping

## Future State Goal
- Both speakers will always have distinctly different voices, even when they share the same gender
- Hebrew language will use clearly distinguishable male and female voices
- The voice selection logic will include a mechanism to ensure speaker voice differentiation
- Fixed voice configurations will provide optimal voice pairings for each language

## Implementation Plan

### Step 1: Fix Voice Gender Mapping Issues
- [x] Correct the `Gacrux` voice gender inconsistency in voice_gender_mapping
- [x] Verify all voice gender mappings are accurate according to Google TTS documentation
- [x] Update Hebrew voice configuration to use more distinct voices

### Step 2: Implement Voice Differentiation Logic
- [x] Add a new method `get_distinct_voices_for_speakers()` that ensures different voices
- [x] Modify the voice selection logic to prevent identical voice assignment
- [x] Update both fixed and randomized voice selection to use differentiation logic

### Step 3: Update Voice Configuration for Hebrew
- [x] Change Hebrew male voice from 'Algenib' to a more distinct alternative
- [x] Ensure Hebrew voice pairing provides maximum audio distinction
- [ ] Test voice combinations for optimal clarity and differentiation

### Step 4: Update TTS Client and Script Generator
- [x] Modify TTS client to use the new distinct voice selection method
- [x] Update script generator voice selection calls
- [x] Ensure all voice selection calls use the improved logic

### Step 5: Testing and Validation
- [ ] Test voice selection with same-gender speakers
- [ ] Verify Hebrew voice combinations sound distinct
- [ ] Test randomization still works with voice differentiation
- [ ] Validate voice selection logs show different voices for different speakers

## Implementation Summary

### Key Changes Made:

1. **Fixed Voice Gender Mapping Bug**: 
   - Corrected `Gacrux` voice which was incorrectly listed as both male and female
   - Now properly categorized as male voice only

2. **Enhanced Hebrew Voice Configuration**:
   - Changed Hebrew male voice from 'Algenib' (Gravelly) to 'Alnilam' (Firm)
   - This provides better distinction from female voice 'Aoede' (Breezy)
   - Both voices should now have clearly different characteristics

3. **Implemented Voice Differentiation Logic**:
   - Added new `get_distinct_voices_for_speakers()` method
   - Added `_get_alternative_voice()` helper method
   - Logic automatically ensures speakers get different voices even if same gender
   - Maintains deterministic randomization for episode_id consistency

4. **Updated Voice Selection Calls**:
   - Modified TTS client to use new distinct voice selection method
   - Updated script generator to use the same improved logic
   - Both now guarantee different voices for different speakers

### Technical Details:

- The new system checks if two speakers would get the same voice
- If identical voices detected, automatically selects alternative for second speaker
- Alternative selection respects gender requirements and episode_id determinism
- Comprehensive logging shows voice selection reasoning and results

### Expected Results:

- Episodes should no longer have identical voices for different speakers
- Hebrew episodes will have more distinct voice characteristics
- Randomization still works but with voice differentiation guarantee
- All voice selection decisions are logged for debugging and verification 