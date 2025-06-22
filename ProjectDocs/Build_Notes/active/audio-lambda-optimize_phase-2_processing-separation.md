# Task Objective
Refactor the audio generation pipeline by extracting preprocessing and AI-heavy steps out of the Audio Generation Lambda, reducing its runtime and cost while improving maintainability.

# Current State Assessment
- `audio_generation_handler.py` currently performs:
  1. Telegram content extraction and cleaning.
  2. Gemini-based content analysis (category + dynamic role).
  3. Gemini script generation with dynamic TTS markup.
  4. Hebrew *niqqud* pre-processing.
  5. Google TTS synthesis and WAV assembly.
  6. Transcript & audio upload + DB updates and callback.
- Steps 1-4 are CPU/AI heavy and lengthen the Lambda execution time unnecessarily.
- Telegram Lambda only stores raw channel data on S3 and then immediately triggers the Audio Lambda via SQS.
- Long execution times increase costs and limit parallel throughput.

# Future State Goal
- **Single-responsibility functions:**  
  • Telegram Lambda → collect raw data.  
  • NEW *Preprocessor Lambda* → clean content, analyse, generate script.  
  • Audio Lambda → *only* niqqud (if needed) + TTS + upload.
- Persist intermediate artefacts (clean content, analysis JSON, script) on S3/Supabase for traceability.
- Decouple stages with dedicated SQS queues or Step Functions for better retries & observability.
- Episode status flow: `content_collected` → `script_ready` → `audio_processing` → `completed`.

# Implementation Plan
1. **Architecture Design**
   - [ ] Sketch sequence & update docs (`ProjectDocs/contexts/appFlow.md`).
   - [ ] Provision two new SQS queues: `script-generation-queue`, `audio-generation-queue`.
2. **Preprocessor Lambda**
   - [ ] Bootstrap SAM template `script-preprocessor-lambda`.
   - [ ] Re-use `TelegramContentExtractor`, `ContentAnalyzer`, `GeminiScriptGenerator`.
   - [ ] Write handler to:
     - Fetch raw Telegram JSON from S3.
     - Produce `clean_content.json`, `analysis.json`, `script.txt` on S3.
     - Update `episodes.status = 'script_ready'` and save artefact URLs.
     - Publish SQS message to `audio-generation-queue` { episode_id, script_url, analysis_url }.
3. **Modify Telegram Lambda**
   - [ ] Change SQS target from `audio-generation-queue` to `script-generation-queue`.
   - [ ] Pass along S3 path + ids.
4. **Simplify Audio Generation Lambda**
   - [ ] Remove content extraction & script generation code paths (keep fallback for transition phase).
   - [ ] Load prepared `script.txt` and `analysis.json` from S3.
   - [ ] Retain niqqud logic (may later move as well) and TTS synthesis.
   - [ ] Rename statuses: set `audio_processing` at start, `completed` at end.
5. **Data Model Updates (Supabase)**
   - [ ] Add columns: `script_url`, `analysis`, `speaker2_role`.
   - [ ] Update types & drizzle schema.
6. **Next.js API & Cron Jobs**
   - [ ] Update episode-checker cron to push only when status = `content_collected`.
7. **Deployment & Infra**
   - [ ] Extend `template.yaml` files for new Lambda & queues.
   - [ ] Add IAM policies for S3 + SQS.
8. **Testing**
   - [ ] Unit test Preprocessor Lambda with fixture Telegram JSON.
   - [ ] Integration test end-to-end via localstack or staging AWS.
9. **Observability**
   - [ ] Add CloudWatch dashboards per stage.
   - [ ] Configure DLQs and alarm on error rates > 5%.

*Continue to append updates; NEVER delete completed tasks.* 