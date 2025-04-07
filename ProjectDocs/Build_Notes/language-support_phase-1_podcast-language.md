 # Multi-language Support Implementation

## Task Objective
Implement proper language support at both podcast and episode levels, resolving the inconsistency between podcast language settings and episode language storage.

## Current State Assessment
- Podcasts have `outputLanguage` field at creation, supporting English and Hebrew
- Language is hardcoded at the episode level to "English" during creation
- There's no proper inheritance of language from podcast to episodes
- Database schema doesn't explicitly store language at podcast level

## Future State Goal
- Language is properly defined at the podcast level
- Episodes inherit language from their parent podcast by default
- Episodes can override language when needed
- UI clearly communicates language inheritance

## Implementation Plan

1. **Database Schema Updates**
   - [x] Add `language` field to `podcast_configs` table
   - [ ] Create and run database migration

2. **Backend Implementation**
   - [x] Update podcast creation to save language in the dedicated field
   - [x] Update `getPodcastById` to use the language field instead of deriving from content source
   - [x] Modify episode creation to inherit language from parent podcast

3. **UI Improvements**
   - [x] Update episode edit form to indicate language inheritance
   - [ ] Make language field more user-friendly (dropdown with language options)

4. **Additional Tasks**
   - [ ] Update existing podcasts with correct language values
   - [ ] Add language filtering capability in podcast and episode lists
   - [ ] Consider implementing language-specific voice generation settings

## Notes
- Implementation preserves backwards compatibility with existing podcasts
- Episode language can still be manually overridden, supporting multilingual podcasts
- Default language for podcasts without a set language is English

## Migration Instructions
After deploying the code changes:
1. Run `npx drizzle-kit generate` to create migration files
2. Apply migrations with `npx drizzle-kit push`
3. Verify database schema updates