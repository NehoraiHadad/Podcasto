# Audio Quality Checklist - Single-Speaker Feature

**Purpose**: Standardized checklist for validating audio quality of single-speaker and multi-speaker podcasts
**Version**: 1.0
**Date**: 2025-10-28

---

## Overview

This checklist provides a systematic approach to validating the audio quality of generated podcast episodes. Use this checklist for every episode generation test, especially when validating the single-speaker feature.

**Test Types**:
- **Primary Test**: Single-speaker episode validation
- **Regression Test**: Multi-speaker episode validation (ensure no degradation)

---

## Part 1: Pre-Listening Setup

### Episode Information

- **Episode ID**: _________________
- **Podcast Name**: _________________
- **Podcast Format**: ☐ Single-Speaker ☐ Multi-Speaker
- **Expected Duration**: _______ seconds
- **Actual Duration**: _______ seconds
- **Test Date**: _________________
- **Tester**: _________________

### Audio File Access

- [ ] Audio file downloaded successfully from S3
- [ ] Audio file playable in standard media player
- [ ] File size is reasonable (> 1MB for full episode)
- [ ] Audio format verified (WAV or MP3)

---

## Part 2: Single-Speaker Audio Validation

### 2.1 Voice Consistency

**Critical**: Single-speaker episodes MUST use only one voice throughout

- [ ] **Single voice used throughout entire episode**
  - ☐ Pass: Only one voice from start to finish
  - ☐ Fail: Multiple voices detected
  - Notes: _______________________________________________

- [ ] **No voice changes mid-sentence**
  - ☐ Pass: Voice characteristics remain constant
  - ☐ Fail: Voice changes detected mid-speech
  - Location of issue (timestamp): _______________

- [ ] **No voice changes between sections**
  - ☐ Pass: Voice remains consistent across transitions
  - ☐ Fail: Different voice in different sections
  - Sections affected: _______________

- [ ] **Consistent tone throughout**
  - ☐ Pass: Natural, consistent tone
  - ☐ Partial: Some tonal inconsistencies
  - ☐ Fail: Significant tonal variations
  - Notes: _______________________________________________

- [ ] **Consistent pitch level**
  - ☐ Pass: Pitch remains stable
  - ☐ Fail: Noticeable pitch variations
  - Notes: _______________________________________________

- [ ] **Consistent speaking pace**
  - ☐ Pass: Natural, consistent pacing
  - ☐ Fail: Erratic or unnatural pacing
  - Notes: _______________________________________________

**Voice Consistency Score**: _____ / 6

---

### 2.2 TTS Markup Respect

**Purpose**: Verify that TTS markup instructions are correctly applied

- [ ] **Pauses occur where [pause] marked**
  - ☐ Pass: All pauses present and natural
  - ☐ Partial: Most pauses present
  - ☐ Fail: Pauses missing or incorrect
  - Number of pauses checked: _____
  - Issues found: _______________

- [ ] **Excitement conveyed for [excited] sections**
  - ☐ Pass: Energy and enthusiasm noticeable
  - ☐ Partial: Some excitement present
  - ☐ Fail: No change in delivery
  - Sample timestamp: _______________

- [ ] **Emphasis applied to [emphasis] words**
  - ☐ Pass: Clear emphasis on marked words
  - ☐ Partial: Weak emphasis
  - ☐ Fail: No emphasis detected
  - Sample words checked: _______________

- [ ] **Thoughtful tone for [thoughtful] sections**
  - ☐ Pass: Reflective, slower delivery
  - ☐ Partial: Slight tonal shift
  - ☐ Fail: No tonal change
  - Sample timestamp: _______________

- [ ] **Speed variations for [slow] or [fast] markers**
  - ☐ Pass: Speed changes appropriately
  - ☐ Not Applicable: No speed markers used
  - ☐ Fail: Speed markers ignored
  - Notes: _______________

- [ ] **Question intonation for interrogatives**
  - ☐ Pass: Natural rising inflection on questions
  - ☐ Fail: Flat delivery of questions
  - Sample questions: _______________

**TTS Markup Score**: _____ / 6

---

### 2.3 Audio Technical Quality

**Purpose**: Assess technical audio characteristics

- [ ] **Clear pronunciation**
  - ☐ Pass: All words clearly articulated
  - ☐ Partial: Minor pronunciation issues
  - ☐ Fail: Significant pronunciation problems
  - Problematic words: _______________

- [ ] **No distortion or clipping**
  - ☐ Pass: Clean audio throughout
  - ☐ Partial: Minor distortion in places
  - ☐ Fail: Noticeable distortion/clipping
  - Affected timestamps: _______________

- [ ] **No audio artifacts or glitches**
  - ☐ Pass: Smooth audio playback
  - ☐ Fail: Clicks, pops, or other artifacts
  - Type of artifacts: _______________

- [ ] **Natural pacing (not too fast/slow)**
  - ☐ Pass: Comfortable listening speed
  - ☐ Too Fast: Difficult to follow
  - ☐ Too Slow: Unnaturally slow
  - Estimated words per minute: _____

- [ ] **Good volume levels**
  - ☐ Pass: Consistent, appropriate volume
  - ☐ Fail: Volume too low/high or inconsistent
  - Notes: _______________

- [ ] **No background noise or hiss**
  - ☐ Pass: Clean background
  - ☐ Fail: Noticeable background noise
  - Type of noise: _______________

- [ ] **Proper audio normalization**
  - ☐ Pass: Consistent loudness throughout
  - ☐ Fail: Significant volume variations
  - Notes: _______________

**Technical Quality Score**: _____ / 7

---

### 2.4 Content Quality (Single-Speaker Specific)

**Purpose**: Ensure script is appropriate for monologue format

- [ ] **Script makes sense as monologue**
  - ☐ Pass: Natural monologue structure
  - ☐ Fail: Sounds like dialogue with missing parts
  - Notes: _______________

- [ ] **Direct address to audience**
  - ☐ Pass: Uses "you", "we", "let's" appropriately
  - ☐ Fail: No audience engagement
  - Examples: _______________

- [ ] **No awkward speaker changes**
  - ☐ Pass: Smooth, continuous narrative
  - ☐ Fail: Abrupt transitions or missing context
  - Notes: _______________

- [ ] **Natural flow and coherence**
  - ☐ Pass: Logical progression of ideas
  - ☐ Fail: Disjointed or confusing narrative
  - Notes: _______________

- [ ] **Appropriate use of rhetorical questions**
  - ☐ Pass: Natural and engaging
  - ☐ N/A: No rhetorical questions used
  - ☐ Fail: Awkward or excessive
  - Notes: _______________

- [ ] **Transitions between topics are smooth**
  - ☐ Pass: Clear, natural transitions
  - ☐ Fail: Abrupt or missing transitions
  - Notes: _______________

**Content Quality Score**: _____ / 6

---

### 2.5 Source Content Fidelity

**Purpose**: Verify audio reflects source Telegram content

- [ ] **Key information from Telegram included**
  - ☐ Pass: All major points covered
  - ☐ Partial: Some content missing
  - ☐ Fail: Significant content omitted
  - Missing topics: _______________

- [ ] **Content accurate to source**
  - ☐ Pass: No factual errors
  - ☐ Fail: Inaccuracies or misrepresentations
  - Issues: _______________

- [ ] **Appropriate summarization**
  - ☐ Pass: Good balance of detail
  - ☐ Too Detailed: Script too long
  - ☐ Too Brief: Important details missing
  - Notes: _______________

- [ ] **Context preserved**
  - ☐ Pass: Source context maintained
  - ☐ Fail: Context lost or distorted
  - Notes: _______________

**Content Fidelity Score**: _____ / 4

---

## Part 3: Multi-Speaker Audio Validation (Regression Test)

### 3.1 Voice Characteristics

**Purpose**: Ensure multi-speaker functionality still works correctly

- [ ] **Two distinct voices present**
  - ☐ Pass: Clearly distinguishable voices
  - ☐ Fail: Voices too similar or only one voice
  - Voice characteristics: _______________

- [ ] **Voice assignment consistent**
  - ☐ Pass: Each speaker keeps same voice
  - ☐ Fail: Voice swapping between speakers
  - Notes: _______________

- [ ] **Appropriate gender voices**
  - ☐ Pass: Voices match configured genders
  - ☐ N/A: Both speakers same gender
  - ☐ Fail: Voice genders incorrect
  - Expected: _____ Actual: _____

- [ ] **Voice quality comparable to before feature**
  - ☐ Pass: Same or better quality
  - ☐ Fail: Quality degraded
  - Notes: _______________

**Multi-Speaker Voice Score**: _____ / 4

---

### 3.2 Dialogue Quality

**Purpose**: Validate natural conversation flow

- [ ] **Natural dialogue flow**
  - ☐ Pass: Sounds like real conversation
  - ☐ Fail: Stilted or unnatural
  - Notes: _______________

- [ ] **Appropriate speaker turns**
  - ☐ Pass: Logical back-and-forth
  - ☐ Fail: Awkward turn-taking
  - Notes: _______________

- [ ] **No overlapping speech**
  - ☐ Pass: Clean transitions between speakers
  - ☐ Fail: Voices overlap
  - Affected timestamps: _______________

- [ ] **Conversational dynamics present**
  - ☐ Pass: Questions, answers, reactions natural
  - ☐ Fail: Mechanical or forced dialogue
  - Notes: _______________

- [ ] **Speaker roles clear**
  - ☐ Pass: Host/expert roles distinguishable
  - ☐ Fail: Roles unclear or inconsistent
  - Notes: _______________

**Dialogue Quality Score**: _____ / 5

---

## Part 4: Comparative Analysis

### Format Comparison (Optional)

**Purpose**: Compare similar podcasts in different formats

If testing both formats for the same podcast:

| Metric | Single-Speaker | Multi-Speaker |
|--------|---------------|---------------|
| Duration | _____ sec | _____ sec |
| Content Coverage | ☐ Same ☐ Different | ☐ Same ☐ Different |
| Engagement Level | ☐ High ☐ Medium ☐ Low | ☐ High ☐ Medium ☐ Low |
| Technical Quality | ___/10 | ___/10 |
| Preference | | |

**Overall Preference**: ☐ Single-Speaker ☐ Multi-Speaker ☐ No Preference

**Reasoning**: _________________________________________________

---

## Part 5: Overall Assessment

### Critical Issues (Block Release)

**Any critical issue = FAIL**

- [ ] **Multiple voices in single-speaker episode**
- [ ] **Audio file corrupted or unplayable**
- [ ] **Complete mismatch with source content**
- [ ] **Severe audio quality issues (distortion, noise)**
- [ ] **Missing required speaker in multi-speaker**

**Critical Issues Found**: ☐ Yes ☐ No

If YES, describe: _______________________________________________

---

### Quality Scores Summary

| Category | Score | Max | Percentage |
|----------|-------|-----|------------|
| Voice Consistency (Single) | ___ | 6 | ___% |
| TTS Markup Respect | ___ | 6 | ___% |
| Technical Quality | ___ | 7 | ___% |
| Content Quality (Single) | ___ | 6 | ___% |
| Content Fidelity | ___ | 4 | ___% |
| Multi-Speaker Voice | ___ | 4 | ___% |
| Dialogue Quality (Multi) | ___ | 5 | ___% |

**Overall Score**: _____ / 38 (_____%)

---

### Quality Ratings

**Overall Audio Quality**:
- ☐ Excellent (95-100%): Production-ready, no issues
- ☐ Good (85-94%): Minor improvements possible, acceptable
- ☐ Acceptable (70-84%): Meets minimum standards, some issues
- ☐ Poor (50-69%): Significant issues, needs improvement
- ☐ Fail (<50%): Not acceptable, major rework needed

**Recommendation**:
- ☐ Approve for Production
- ☐ Approve with Minor Fixes
- ☐ Reject - Requires Significant Improvements
- ☐ Reject - Critical Issues

---

## Part 6: Issue Documentation

### Issues Found

**Issue 1**:
- **Severity**: ☐ Critical ☐ High ☐ Medium ☐ Low
- **Category**: ☐ Voice ☐ Technical ☐ Content ☐ Other
- **Description**: _______________________________________________
- **Timestamp/Location**: _______________
- **Impact**: _______________________________________________
- **Suggested Fix**: _______________________________________________

**Issue 2**:
- **Severity**: ☐ Critical ☐ High ☐ Medium ☐ Low
- **Category**: ☐ Voice ☐ Technical ☐ Content ☐ Other
- **Description**: _______________________________________________
- **Timestamp/Location**: _______________
- **Impact**: _______________________________________________
- **Suggested Fix**: _______________________________________________

**Issue 3**:
- **Severity**: ☐ Critical ☐ High ☐ Medium ☐ Low
- **Category**: ☐ Voice ☐ Technical ☐ Content ☐ Other
- **Description**: _______________________________________________
- **Timestamp/Location**: _______________
- **Impact**: _______________________________________________
- **Suggested Fix**: _______________________________________________

*(Add more issues as needed)*

---

## Part 7: Positive Highlights

**What worked well**:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Notable improvements**:
1. _______________________________________________
2. _______________________________________________

---

## Part 8: Additional Notes

### Test Environment
- **Playback Device**: _______________
- **Audio Player**: _______________
- **Headphones/Speakers**: _______________
- **Ambient Noise Level**: ☐ Quiet ☐ Moderate ☐ Noisy

### Comparison Reference
- **Compared to episode ID**: _______________
- **Relative quality**: ☐ Better ☐ Same ☐ Worse

### General Observations
_____________________________________________________
_____________________________________________________
_____________________________________________________

---

## Part 9: Sign-Off

**Tester Signature**: ______________________ Date: __________

**Reviewer Signature**: ____________________ Date: __________

**Status**: ☐ PASS ☐ PASS WITH NOTES ☐ FAIL

---

## Appendix A: Quick Reference

### Voice Consistency Red Flags (Single-Speaker)
- Multiple voices heard
- Voice gender changes
- Accent changes
- Pitch variations > 20%
- Speaking rate changes > 30%

### Technical Quality Red Flags
- Clipping/distortion present
- Volume variations > 6dB
- Background hiss/noise
- Audio dropouts
- Unnatural pauses (> 3 seconds)

### Content Quality Red Flags (Single-Speaker)
- Sounds like half a conversation
- Unexplained context switches
- Missing connective phrases
- No audience engagement

### Multi-Speaker Red Flags
- Single voice used instead of two
- Voices too similar (< 70% distinguishability)
- Unnatural dialogue flow
- Speaker role confusion

---

## Appendix B: Benchmark Standards

### Target Metrics (Single-Speaker)
- Voice Consistency: 100% (no variations allowed)
- TTS Markup: ≥ 90% markup respected
- Technical Quality: ≥ 90% clean audio
- Content Quality: ≥ 85% natural flow
- Content Fidelity: ≥ 90% source accuracy

### Target Metrics (Multi-Speaker)
- Voice Distinction: ≥ 90% clearly distinguishable
- Dialogue Flow: ≥ 85% natural conversation
- Technical Quality: ≥ 90% clean audio
- Content Fidelity: ≥ 90% source accuracy

### Acceptable Thresholds
- **Release Quality**: ≥ 85% overall
- **Production Quality**: ≥ 90% overall
- **Premium Quality**: ≥ 95% overall

---

**End of Checklist**

*Save completed checklists in `/docs/testing/results/` directory with filename format: `audio-quality-{episode-id}-{date}.md`*
