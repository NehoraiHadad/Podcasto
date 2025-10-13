# 📚 Detailed Task Files

קבצים מפורטים למשימות ספציפיות מכל תחום.

---

## 📖 כיצד להשתמש בקבצים אלה

1. **קרא את התחום הרלוונטי** מהתיקייה הראשית (01-07)
2. **בחר משימה** מרשימת המשימות
3. **פתח את הקובץ המפורט** של המשימה הזו
4. **עקוב אחר השלבים** צעד אחר צעד
5. **סמן ✅** כל שלב אחרי הביצוע

---

## 📁 קבצים זמינים

### תחום 2: Database Layer
- ✅ **02_split_podcasts_api.md** - פיצול podcasts.ts (245→~100 לקובץ)

### תחום 3: Server Actions
- ✅ **03_split_image_actions.md** - פיצול image-actions.ts (683→~150 לקובץ)

### תחום 4: Services
- ✅ **04_split_post_processing.md** - פיצול post-processing.ts (407→~80 לקובץ)

### תחום 5: UI Components
- ✅ **05_split_image_field.md** - פיצול image-generation-field.tsx (730→~100 לקובץ)

---

## 🎯 קבצים נוספים שיצטרכו

### תחום 1: Authentication (~3 משימות)
- `01_session_service.md`
- `01_error_handling.md`
- `01_role_service.md`

### תחום 2: Database (~3 משימות נוספות)
- `02_schema_documentation.md`
- `02_api_patterns.md`
- `02_query_optimization.md`

### תחום 3: Server Actions (~4 משימות נוספות)
- `03_reorganize_actions.md`
- `03_shared_utilities.md`
- `03_progressive_enhancement.md`
- `03_type_safe_actions.md`
- `03_input_validation.md`

### תחום 4: Services (~7 משימות נוספות)
- `04_refactor_image_enhancement.md`
- `04_unify_s3.md`
- `04_email_service.md`
- `04_service_interfaces.md`
- `04_dependency_injection.md`
- `04_service_tests.md`
- `04_service_factory.md`

### תחום 5: UI Components (~9 משימות נוספות)
- `05_refactor_audio_player.md`
- `05_episode_files.md`
- `05_shared_forms.md`
- `05_extract_server.md`
- `05_container_presenter.md`
- `05_compound_components.md`
- `05_episode_cards.md`
- `05_admin_dashboard.md`
- `05_loading_error.md`

### תחום 6: Admin Features (~7 משימות)
- `06_admin_layout.md`
- `06_podcast_form.md`
- `06_shared_tables.md`
- `06_bulk_operations.md`
- `06_dashboard.md`
- `06_action_menus.md`
- `06_cron_ui.md`

### תחום 7: API Routes (~4 משימות)
- `07_api_utilities.md`
- `07_auth_middleware.md`
- `07_validation.md`
- `07_cron_routes.md`

---

## 📝 תבנית לקובץ משימה חדש

כשתרצה ליצור קובץ משימה נוסף, השתמש בתבנית זו:

```markdown
# משימה X.Y: [כותרת המשימה]

## מטרה
[מה אנחנו רוצים להשיג]

## עדיפות: [🔴 גבוהה / 🟡 בינונית / 🟢 נמוכה]
## זמן משוער: [X שעות]
## תחום: [שם התחום]

---

## 📊 מצב נוכחי
[מצב הקוד הקיים]

## 🎯 מבנה מוצע
[איך זה אמור להיראות אחרי]

## 📚 דוקומנטציה רלוונטית
[קישורים למקורות]

## 📝 שלבי ביצוע
### Step 1: [שם השלב]
[הסבר מפורט]

### Step 2: [שם השלב]
[הסבר מפורט]

## ✅ Checklist
- [ ] Pre-work items
- [ ] During work items
- [ ] Post-work items

## 🎯 קריטריונים להצלחה
- [ ] Success criterion 1
- [ ] Success criterion 2

---

**Status**: ⬜ לא התחיל
**Docs**: [קישורים]
```

---

## 💡 טיפים

### תעדוף משימות
1. התחל ב-Phase 1 (Database + API Routes)
2. המשך ל-Phase 2 (Services + Actions + Auth)
3. סיים ב-Phase 3 (UI + Admin)

### סימון התקדמות
- ⬜ לא התחיל
- 🟡 בתהליך
- ✅ הושלם
- ⏸️ מושהה
- ❌ נכשל / צריך שינוי גישה

### עדכון קבצים
אחרי כל שלב מושלם:
1. עדכן את ה-checklist בקובץ המשימה
2. עדכן את ההתקדמות בקובץ התחום
3. עדכן את ה-MASTER_PLAN

---

**עדכון אחרון**: 2025-10-13
**קבצים זמינים**: 4
**קבצים נדרשים**: ~38 נוספים
