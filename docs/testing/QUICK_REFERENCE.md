# Quick Reference Card - Single-Speaker Testing

**Print this page for quick access during testing**

---

## 🚀 Fast Start (Priority Tests)

### 1. Database Quick Check (5 min)
```sql
-- Run this first!
SELECT podcast_format, COUNT(*) FROM podcast_configs GROUP BY podcast_format;
-- Expected: Shows single-speaker and multi-speaker counts

SELECT COUNT(*) FROM podcast_configs
WHERE podcast_format = 'multi-speaker' AND speaker2_role IS NULL;
-- Expected: 0 (all multi-speaker must have speaker2_role)

SELECT COUNT(*) FROM podcast_configs
WHERE podcast_format = 'single-speaker' AND speaker2_role IS NOT NULL;
-- Expected: 0 (single-speaker should NOT have speaker2_role)
```

### 2. UI Quick Test (10 min)
1. Go to `/admin/podcasts/create`
2. Add language variant → Style & Roles tab
3. Click "Single-Speaker" → Verify Speaker 2 field **disappears**
4. Click "Multi-Speaker" → Verify Speaker 2 field **appears**
5. Try to submit multi-speaker without Speaker 2 → Should **block** with error

### 3. Episode Generation Test (15 min + wait time)
1. Create single-speaker podcast
2. Generate episode
3. Wait for completion (5-10 minutes)
4. Listen to audio → **Must be single voice throughout**

---

## 📊 Critical Checks Checklist

### Pre-Deployment
- [ ] Database integrity: 0 inconsistencies (SQL Section 2-3)
- [ ] Format selector works (TC-1, TC-2)
- [ ] Validation blocks invalid configs (TC-2, TC-4)
- [ ] Single-speaker episode uses 1 voice (TC-10, TC-13)
- [ ] Multi-speaker still works (TC-14, TC-17)

### Post-Deployment
- [ ] Production database validation passes (SQL Section 12)
- [ ] First single-speaker episode successful
- [ ] No multi-speaker regression
- [ ] CloudWatch logs show correct format
- [ ] No error spikes

---

## 🔍 Where to Find Things

| What | Where | Quick Access |
|------|-------|--------------|
| **Test Cases** | SINGLE_SPEAKER_TEST_PLAN.md | Section by section |
| **SQL Queries** | database_validation.sql | Sections 1-12 |
| **Audio Checklist** | AUDIO_QUALITY_CHECKLIST.md | Parts 1-9 |
| **Test Summary** | TESTING_SUMMARY.md | Full overview |
| **Automated Tests** | INTEGRATION_TESTS.md | Code examples |

---

## 🎯 Success Thresholds

| Metric | Minimum | Target | Excellent |
|--------|---------|--------|-----------|
| Database Integrity | 0 errors | 0 errors | 0 errors |
| Episode Success Rate | 90% | 95% | 98% |
| Audio Quality Score | 70% | 85% | 95% |
| Voice Consistency | 100% | 100% | 100% |
| Processing Time Variance | ±20% | ±10% | ±5% |

---

## 🐛 Common Issues & Fixes

### Issue: Multi-speaker podcasts missing speaker2_role
**Query**:
```sql
SELECT id, podcast_name FROM podcast_configs
WHERE podcast_format = 'multi-speaker' AND speaker2_role IS NULL;
```
**Fix**: Update these records to add speaker2_role or change format to single-speaker

### Issue: Multiple voices in single-speaker episode
**Check**: Listen to audio, use checklist Part 2.1
**Fix**: Check voice selection logic in audio generator Lambda

### Issue: Format not in SQS message
**Check**: CloudWatch logs for "podcast_format"
**Fix**: Verify episode generation trigger includes dynamic_config

### Issue: UI doesn't hide Speaker 2 field
**Check**: Browser console for errors
**Fix**: Clear cache, verify podcastFormat watch() working

---

## 📞 Emergency Contacts

**Critical Bug Found?**
1. Stop deployment immediately
2. Use bug report template (in test plan)
3. Mark severity: CRITICAL
4. Notify: Development Lead + Testing Lead

**Question During Testing?**
- Slack: #podcasto-testing
- Email: qa@podcasto.com

---

## 🔢 Test Case Quick Index

| TC | Focus | Time | Priority |
|----|-------|------|----------|
| TC-1 | Create single-speaker UI | 10 min | HIGH |
| TC-2 | Validation check | 5 min | HIGH |
| TC-6 | Server action validation | 10 min | HIGH |
| TC-8 | Script generation | 15 min | HIGH |
| TC-10 | Audio single voice | 15 min | CRITICAL |
| TC-13 | E2E single-speaker | 20 min | CRITICAL |
| TC-14 | E2E multi-speaker | 20 min | HIGH |
| TC-17 | Existing podcasts | 30 min | HIGH |

**Priority Legend**: CRITICAL = Must pass, HIGH = Should pass, MEDIUM = Nice to have

---

## 💾 Essential SQL Queries

### Health Check (Run anytime)
```sql
-- From database_validation.sql Section 12
WITH format_counts AS (
    SELECT podcast_format, COUNT(*) as total_podcasts
    FROM podcast_configs GROUP BY podcast_format
),
integrity_checks AS (
    SELECT
        COUNT(CASE WHEN podcast_format IS NULL THEN 1 END) as null_formats,
        COUNT(CASE WHEN podcast_format NOT IN ('single-speaker', 'multi-speaker') THEN 1 END) as invalid_formats,
        COUNT(CASE WHEN podcast_format = 'single-speaker' AND speaker2_role IS NOT NULL THEN 1 END) as single_with_speaker2,
        COUNT(CASE WHEN podcast_format = 'multi-speaker' AND speaker2_role IS NULL THEN 1 END) as multi_without_speaker2
    FROM podcast_configs
)
SELECT * FROM integrity_checks;
-- Expected: All 4 values = 0
```

### Recent Episodes by Format
```sql
SELECT
    pc.podcast_format,
    COUNT(*) as total,
    COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.created_at > NOW() - INTERVAL '7 days'
GROUP BY pc.podcast_format;
```

---

## 🎵 Audio Quality Fast Check

**Listen for 2 minutes and check**:
- [ ] One voice only (single-speaker) or two voices (multi-speaker)
- [ ] No voice changes
- [ ] Clear pronunciation
- [ ] No distortion
- [ ] Natural pacing

**If ANY fail → Use full checklist**

---

## 📈 Monitoring Dashboard (Post-Deployment)

### Daily (First Week)
- Run health check SQL
- Check latest episodes status
- Review CloudWatch logs for errors

### Weekly (First Month)
- Full database validation (SQL all sections)
- Audio quality spot checks (3-5 episodes)
- Success rate comparison

### Monthly (Ongoing)
- Feature adoption metrics
- Performance trends
- User feedback review

---

## 🚨 Red Flags (Stop and Investigate)

- ❌ Multiple voices in single-speaker episode
- ❌ Database integrity check returns > 0 errors
- ❌ Multi-speaker episodes fail after deployment
- ❌ Format field missing in SQS messages
- ❌ Episode success rate < 90%
- ❌ Audio quality score < 70%

---

## ✅ Green Lights (All Good)

- ✅ Database integrity: 0 errors
- ✅ Single-speaker: 1 voice only
- ✅ Multi-speaker: 2 voices, dialogue format
- ✅ Format validation working
- ✅ Episodes completing successfully
- ✅ CloudWatch logs show format tracking

---

## 🔄 Quick Testing Loop

```
1. Make change
2. Run database health check (5 min)
3. Test UI (5 min)
4. Generate test episode (15 min)
5. Check audio quality (5 min)
6. Review logs (5 min)
7. Document result
8. Repeat if needed
```

**Total: ~35 minutes per iteration**

---

## 📝 Quick Notes Space

**Test Session Date**: _______________
**Tester**: _______________
**Environment**: ☐ Dev ☐ Staging ☐ Prod

**Quick Results**:
- Database Health: ☐ Pass ☐ Fail
- UI Tests: ☐ Pass ☐ Fail
- Audio Quality: ☐ Pass ☐ Fail
- Regression: ☐ Pass ☐ Fail

**Issues Found**: _________________________________
_______________________________________________
_______________________________________________

**Next Steps**: ___________________________________
_______________________________________________

---

**Keep this card handy during testing sessions!**

*For detailed instructions, see the full test plan documents*
