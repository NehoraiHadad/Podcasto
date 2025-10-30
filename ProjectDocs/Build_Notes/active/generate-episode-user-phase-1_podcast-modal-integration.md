# Build Notes: Generate Episode Modal for Users – Phase 1: Podcast Modal Integration

## Task Objective
Enable regular podcast owners (not just admins) to generate episodes for their podcasts via a date-selecting modal interface from `/podcasts/my`. Ensure user-facing clarity, credits logic, and correct episode publication flow.

## Current State Assessment
- Generate Episode modal with date selection was implemented for admins only.
- Manual user generation (w/o range or preview) previously existed, but lacked feature parity and ease-of-use.
- Supporting components were located under `/admin/` and didn’t support direct user UI reuse.

## Future State Goal
- Every podcast owner can easily generate an episode from `/podcasts/my` using a friendly, feature-rich modal.
- Episodes are generated for only the user's own podcasts, immediately public after processing completes.
- User experience is clear, with credits and pause states handled intuitively.

## Implementation Plan
1. Review existing admin Generate Episode logic/modal for modularity and reusability.
2. Move modal and date-range picker components from admin to shared podcasts directory.
3. Update all references and imports to complete modularization.
4. Integrate modal on podcast user card, replacing the old manual generation button.
5. Improve user-facing texts, error feedback, and hover help for clarity.
6. Double-check backend and modal only act on content relevant to the podcast’s own channel.
7. Confirm backend sets new episode to public immediately on generation (no drafts).
8. Test full flow as both user and admin for role clarity and correctness throughout.
9. Append a TODO or hint in the code for possible future "schedule release" support.

## Progress & Decisions Log
- Components are now shared across admin and regular user UIs and no longer admin-specific.
- Modal dialog texts and date picker choices rewritten for non-technical clarity and guidance.
- Manual user credit/paused states made visually intuitive; modals, tooltips, and helpers provided.
- Extensive code review verified that only the correct podcast's Telegram channel/data is used per generation.
- Created episodes move instantly from "pending" (processing state) to "public" upon completion, matching business requirements.
- Testing confirmed that permissions, boundary checks, and flows are enforced for both regular and admin users.
- Future flexibility for draft/delayed publication captured as a code TODO.

## Final Summary
The new Generate Episode feature now offers creators a modern, self-serve episode generation experience, consistent with admin controls but adapted for everyday user simplicity.
