# 👨‍💼 תחום 6: Admin Features

## תאריך יצירה: 2025-10-13
## Phase: 3 (UI Layer)
## תלויות: Components (05), Server Actions (03)

---

## 📊 מצב נוכחי

### Admin Components

| קובץ | שורות | מצב |
|------|-------|-----|
| `admin/podcast-form/podcast-form-tabs.tsx` | 214 | ⚠️ |
| `admin/client-episodes-table.tsx` | 219 | ⚠️ |
| `admin/cron-runner.tsx` | 199 | ⚠️ |
| `admin/podcast-actions-menu.tsx` | 270 | ⚠️ |
| + 30 קבצים נוספים | - | - |

### בעיות

1. **Podcast Form מפוזר** - 12 קבצים בתיקייה
2. **Table Logic מורכב** - sorting, filtering, selection
3. **Bulk Operations** - logic מעורב בקומפוננטים
4. **אין shared admin layouts**

---

## 🎯 מטרות

1. **אחד Admin Layout** - layout קבוע
2. **רפקטור Podcast Form** - ארגון טוב יותר
3. **Table Components משותפים**
4. **Bulk Operations Service**

---

## 📝 משימות

### 6.1: Create Admin Layout System
**[📄 tasks/06_admin_layout.md](./tasks/06_admin_layout.md)**

```tsx
<AdminLayout>
  <AdminSidebar />
  <AdminContent>
    {children}
  </AdminContent>
</AdminLayout>
```

### 6.2: Refactor Podcast Form
**[📄 tasks/06_podcast_form.md](./tasks/06_podcast_form.md)**

מ-12 קבצים → מבנה ברור יותר

### 6.3: Shared Table Components
**[📄 tasks/06_shared_tables.md](./tasks/06_shared_tables.md)**

```tsx
<DataTable
  data={episodes}
  columns={episodeColumns}
  onSort={...}
  onFilter={...}
  selectable
/>
```

### 6.4: Bulk Operations Service
**[📄 tasks/06_bulk_operations.md](./tasks/06_bulk_operations.md)**

### 6.5: Admin Dashboard Redesign
**[📄 tasks/06_dashboard.md](./tasks/06_dashboard.md)**

### 6.6: Action Menus Pattern
**[📄 tasks/06_action_menus.md](./tasks/06_action_menus.md)**

### 6.7: Cron Management UI
**[📄 tasks/06_cron_ui.md](./tasks/06_cron_ui.md)**

---

## 📊 התקדמות: 0/7 משימות (0%)

**סטטוס**: 🔴 לא התחיל
