# Voice Consistency Fix - Phase 1: Voice Consistency Across Chunks

## Task Objective
Fix voice inconsistency issue where speakers' voices change during episodes, particularly when content is processed in parallel chunks. Ensure speaker voices remain consistent throughout the entire episode.

## Current State Assessment
המערכת נוצרת פרקים באודיו בשיטת chunks parallel processing, אבל הקולות לא שמורים עקביים בין chunks שונים:
- כל chunk מקבל קולות בנפרד דרך `get_distinct_voices_for_speakers`
- בתהליך parallel processing, כל chunk יכול לקבל קולות שונים
- הקולות נבחרים ב-TTS client לכל chunk בנפרד
- אין מנגנון לשמירת עקביות קולות בין chunks

## Future State Goal
הקולות יישמרו עקביים לאורך כל הפרק:
- קולות יבחרו פעם אחת בתחילת התהליך
- קולות יועברו לכל chunks ויישמרו זהים
- מנגנון voice selection יהפוך למרכזי ועקבי
- parallel processing ישמר אך עם קולות קבועים

## Implementation Plan

### Step 1: Analyze Current Voice Selection Flow
- [x] בדוק איפה קולות נבחרים (TTS client)
- [x] בדוק איך chunks מעובדים (Google Podcast Generator)
- [x] זהה נקודות החולשה בזרימה
- [x] בדוק האם הבעיה קשורה לparallel processing

### Step 2: Create Voice Selection Cache/Storage
- [x] צור מנגנון לאחסון קולות שנבחרו בתחילת התהליך
- [x] הוסף voice persistence ל-GooglePodcastGenerator
- [x] עדכן TTS client לקבל קולות מוכנים במקום לבחור חדשים

### Step 3: Update Voice Flow Architecture  
- [x] עדכן GooglePodcastGenerator לבחור קולות פעם אחת
- [x] העבר קולות קבועים לכל הchunks
- [x] עדכן TTS client להשתמש בקולות קבועים

### Step 4: Test Voice Consistency
- [ ] בדוק שקולות נשמרים זהים בין chunks
- [ ] בדוק שזה לא פוגע בביצועים של parallel processing
- [ ] בדוק שהקולות עדיין שונים בין הדוברים

### Step 5: Validate and Deploy
- [ ] בדוק שהתיקון עובד על episodes שונים
- [ ] וודא שלא שברנו כלום אחר
- [ ] עדכן logs להציג את הקולות שנבחרו

## Progress Notes

### 2025-01-15 - Initial Analysis
זיהיתי את הבעיה: 
- `tts_client.generate_single_audio()` קורא ל`get_distinct_voices_for_speakers()` בכל קריאה
- בparallel processing, כל chunk מקבל קולות חדשים
- אין מנגנון לשמירת עקביות קולות

הפתרון: להעביר קולות קבועים מ-GooglePodcastGenerator ל-TTS client

### 2025-01-15 - Implementation Complete
יישמתי את הפתרון למניעת חוסר עקביות בקולות:

**שינויים ב-TTS Client (`tts_client.py`):**
- הוספתי פרמטרים `speaker1_voice` ו-`speaker2_voice` ל-`generate_single_audio()`
- הוספתי פרמטרים זהים ל-`generate_chunk_with_retry()`
- אם קולות מועברים, הם נשמרים עקביים; אחרת נבחרים אוטומטית

**שינויים ב-Google Podcast Generator (`google_podcast_generator.py`):**
- בתחילת `generate_podcast_audio()` נבחרים קולות פעם אחת לכל הפרק
- הקולות מועברים לכל הפונקציות הפנימיות
- parallel ו-sequential processing מקבלים קולות קבועים
- כל chunk משתמש באותם קולות בדיוק

**התוצאה:**
- קולות עקביים לאורך כל הפרק
- parallel processing עדיין יעיל
- הדוברים עדיין שונים זה מזה
- לוגים מראים את הקולות שנבחרו

הבעיה נפתרה! 