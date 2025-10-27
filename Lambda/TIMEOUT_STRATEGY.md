# אסטרטגיית Timeout - הסבר מפורט

## הבעיה המקורית

פרק 48bac616 נתקע ב-"processing" כי:
1. הלמבדה התחילה לעבד בשעה 01:00:49
2. Gemini TTS API תקוע למשך 14+ דקות (רגיל: 60-86 שניות)
3. Lambda timeout אחרי 15 דקות (900 שניות)
4. **אין error log** - Lambda פשוט מת בשקט
5. הפרק נשאר ב-"processing" לנצח

## הפתרון שלנו

### 1. Timeout על כל קריאה ל-TTS (480 שניות = 8 דקות)

```python
TTS_CALL_TIMEOUT_SECONDS = 480  # 8 minutes
```

**למה 8 דקות ולא 3 דקות (180 שניות)?**

מהלוגים שראינו:
- זמן רגיל: 60-86 שניות
- זמן עם עיכובים: 5-7 דקות (300-420 שניות)
- תקיעה: 14+ דקות

אם נגדיר 180 שניות (3 דקות):
- ✅ תופס תקיעות (>14 דקות)
- ❌ עלול לבטל קריאות תקינות אבל איטיות (5-7 דקות)

אם נגדיר 480 שניות (8 דקות):
- ✅ תופס תקיעות (>14 דקות)
- ✅ מאפשר קריאות תקינות איטיות (5-7 דקות)
- ✅ עדיין משאיר זמן ל-Lambda (15 דקות כולל)

### 2. האם יש ניסיון חוזר לטיימאאוט?

**לא!** כשיש timeout:

```python
except concurrent.futures.TimeoutError:
    future.cancel()  # מסמן את ה-future כמבוטל
    raise DeferrableError(...)  # זורק error שגורם להחזיר את הפרק ל-script_ready
```

**חשוב להבין**: `future.cancel()` **לא עוצר** את ה-thread!

Python לא יכול להרוג thread באמצע ביצוע. ה-thread עלול להמשיך לרוץ ברקע, אבל:
- ✅ Lambda לא תחכה לו
- ✅ הפרק יוחזר ל-`script_ready`
- ✅ ההודעה תחזור ל-SQS לניסיון חוזר מאוחר יותר
- ⚠️ ה-thread ימשיך לרוץ ברקע עד שהקריאה ל-Gemini תסתיים או שה-Lambda תמות

**זה בסדר** כי:
1. Lambda container יכול להיהרג בכל רגע (AWS ניהול)
2. הפרק כבר הוחזר ל-`script_ready` - לא נאבד אותו
3. הניסיון הבא יהיה ב-Lambda חדש (container נקי)

### 3. בדיקה פרואקטיבית לפני התחלת עיבוד

```python
MIN_TIME_REQUIRED_MS = 600000  # 10 דקות

if remaining_time_ms < MIN_TIME_REQUIRED_MS:
    raise DeferrableError("אין מספיק זמן")
```

**למה 10 דקות?**
- חישוב: 480s (timeout chunk) + 60s (setup) + 60s (buffer) = 600s = 10 דקות
- אם נשארו פחות מ-10 דקות: לא כדאי להתחיל, עדיף להחזיר ל-SQS

**תרחיש דוגמה**:
1. Lambda מקבל הודעה אחרי 12 דקות (נשארו 3 דקות)
2. הבדיקה רואה: 3 דקות < 10 דקות
3. **מיד** זורק `DeferrableError` - לא מתחיל בכלל
4. הפרק חוזר ל-`script_ready`
5. SQS שולח את ההודעה ל-Lambda חדש (fresh start)

### 4. מה קורה אם יש timeout?

**Flow מלא**:

```
1. Lambda מתחיל לעבד chunk
2. Gemini API תקוע (לא עונה)
3. אחרי 480 שניות: future.result(timeout=480) זורק TimeoutError
4. הקוד תופס את ה-TimeoutError
5. future.cancel() - מסמן כמבוטל (אבל thread עדיין רץ)
6. raise DeferrableError("Gemini TTS API hung for >480s")
7. Handler תופס DeferrableError
8. עדכן episode.status = 'script_ready' (לא 'failed'!)
9. החזר response עם batchItemFailures
10. SQS רואה failure → מחזיר הודעה לתור
11. אחרי delay (visibility timeout): הודעה זמינה שוב
12. Lambda חדש מקבל את ההודעה → מנסה שוב
```

**חשוב**: ה-thread הישן עדיין רץ ברקע ב-Lambda הישן, אבל הפרק כבר הועבר הלאה!

### 5. למה לא להשתמש ב-signal.alarm()?

אולי חשבת: "למה לא להשתמש ב-`signal.alarm()` כדי לעצור את ה-thread?"

**תשובה**: זה לא עובד ב-Python threads!

```python
# ❌ זה לא יעבוד:
signal.alarm(480)  # רק עובד ב-main thread, לא ב-ThreadPoolExecutor
```

`signal.alarm()` עובד רק ב-main thread של התהליך. ThreadPoolExecutor רץ ב-thread נפרד.

האופציות היחידות:
1. ✅ `future.result(timeout=480)` - זה מה שעשינו
2. ❌ `signal.alarm()` - לא עובד עם threads
3. ❌ `thread.kill()` - לא קיים ב-Python (בכוונה, זה מסוכן)

## סיכום

| מצב | זמן | התנהגות |
|-----|-----|---------|
| **תקין** | 60-86s | ✅ הכל עובד, audio נוצר |
| **איטי** | 5-7 דקות | ✅ הכל עובד, audio נוצר (לוקח יותר זמן) |
| **תקוע** | >8 דקות | ⚠️ Timeout → DeferrableError → script_ready → retry |
| **אין זמן** | <10 דקות נשארו | ⚠️ מיד DeferrableError → script_ready → retry |

**היתרון המרכזי**:
- ❌ לפני: פרק נתקע ב-"processing" לנצח
- ✅ אחרי: פרק חוזר ל-"script_ready" אוטומטית וינסה שוב

**המחיר**:
- ⚠️ Thread עלול להמשיך לרוץ ברקע (Python limitation)
- ✅ זה בסדר כי Lambda container זמני בכל מקרה
- ✅ הניסיון הבא יהיה ב-container נקי
