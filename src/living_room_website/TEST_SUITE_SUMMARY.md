# LRB Test Suite - Quick Reference

## 📦 Complete File List

All test files are ready in `/home/claude/`:

### Main Files
1. **test_validation_dashboard.html** - Interactive testing dashboard with 52-point checklist
2. **TESTING_GUIDE.md** - Comprehensive testing documentation
3. **test_cases.json** - Index of all test scenarios

### Test Case JSON Files

| # | Filename | Focus | Upcoming | Past | Key Features |
|---|----------|-------|----------|------|--------------|
| 1 | test_case_1_single_breakfast.json | Breakfast before | 1 | 1 | 09:00 concert, 08:00 breakfast |
| 2 | test_case_2_two_upcoming.json | isCurrent logic | 2 | 1 | Tests that only isCurrent='Y' shows |
| 3 | test_case_3_min_past.json | Minimum past events | 1 | 2 | Snacks before, no pagination |
| 4 | test_case_4_max_past.json | Maximum pagination | 1 | 15 | Tests "View More" with 15 events |
| 5 | test_case_5_all_meals.json | All meal types | 1 | 4 | Breakfast, lunch, snacks, dinner |
| 6 | test_case_6_long_titles.json | Title lengths | 1 | 4 | 1-6+ word titles |
| 7 | test_case_7_evening_dinner.json | Evening concert | 1 | 1 | 19:00 concert, 21:00 dinner |
| 8 | test_case_8_morning_early.json | Early morning | 1 | 1 | 08:00 concert, 10:00 breakfast |
| 9 | test_case_9_no_upcoming.json | No upcoming fallback | 0 | 3 | Tests fallback message |
| 10 | test_case_10_missing_fields.json | Missing fields | 1 | 2 | Null handling & defaults |

## 🎯 Test Coverage Matrix

| Feature | Test Cases | Coverage |
|---------|------------|----------|
| **Meal Types** | | |
| Breakfast | 1, 5, 8 | ✓ Before & After |
| Lunch | 5 | ✓ Before & After |
| Snacks | 3, 5 | ✓ Before |
| Dinner | 2, 4, 5, 7, 9 | ✓ After |
| **Timing** | | |
| 8:00 AM | 8 | ✓ Early morning |
| 9:00 AM | 1 | ✓ Morning |
| 3:00 PM | 3 | ✓ Afternoon |
| 6:00 PM | 2, 9, 10 | ✓ Evening |
| 7:00 PM | 7 | ✓ Evening |
| **Past Events** | | |
| 0 events | - | (Could add) |
| 1 event | 1, 7, 8 | ✓ Single |
| 2 events | 3 | ✓ Minimum |
| 3 events | 9 | ✓ Small set |
| 4 events | 5, 6 | ✓ Default display |
| 15 events | 4 | ✓ Maximum pagination |
| **Title Lengths** | | |
| 1 word | 6 | ✓ "Raag" |
| 2-3 words | 2, 3, 7, 8, 9 | ✓ Normal |
| 4-5 words | 1, 4, 5 | ✓ Long |
| 6+ words | 6 | ✓ Very long |
| **Data Integrity** | | |
| Complete data | 1-9 | ✓ All fields present |
| Missing optionals | 10 | ✓ Null handling |
| Empty arrays | 10 | ✓ No artists |

## 🚦 Testing Priority

### P0 - Critical (Must Test First)
1. Test 2 - isCurrent logic (core functionality)
2. Test 4 - Pagination with 15 events (performance)
3. Test 9 - No upcoming fallback (error handling)
4. Test 10 - Missing fields (data integrity)

### P1 - High Priority
5. Test 5 - All meal types (variety)
6. Test 6 - Long titles (UI/UX)
7. Test 1 - Basic breakfast scenario

### P2 - Standard
8. Test 3 - Minimum past events
9. Test 7 - Evening concert
10. Test 8 - Morning concert

## 📊 Expected Results Summary

### Test 1: Single Breakfast
- **Hero:** Morning Raga at 09:00, breakfast at 08:00
- **Time Display:** "08:00 — Breakfast followed by Baithak<br/>09:00 — Baithak Begins"
- **Past:** 1 event (Kishori Amonkar)
- **Pagination:** No "View More" button

### Test 2: Two Upcoming
- **Hero:** "Evening Sitar" (isCurrent=Y), NOT "Future Baithak"
- **Past:** 1 event
- **Critical:** Must show only first concert

### Test 3: Minimum Past
- **Hero:** Afternoon Melodies, 15:00, snacks at 14:00
- **Past:** 2 events displayed
- **Pagination:** No "View More" button

### Test 4: Maximum Past
- **Hero:** Current Baithak
- **Past:** 4 initially, then 15 after clicking "View More"
- **Critical:** Button behavior and grid layout

### Test 5: All Meals
- **Hero:** Lunch at 13:00, meal at 14:30
- **Past:** 4 events, each with different meal type/order
- **Critical:** All 4 meal types format correctly

### Test 6: Long Titles
- **Hero:** "Evening Journey Through Classical Heritage: Exploring..."
- **Past:** Mix of very short ("Raag") to very long titles
- **Critical:** Text wrapping and visual balance

### Test 7: Evening
- **Hero:** 19:00 concert, 21:00 dinner
- **Past:** 1 event
- **Critical:** Evening time displays correctly

### Test 8: Morning
- **Hero:** 08:00 concert, 10:00 breakfast
- **Past:** 1 event with 07:30 concert
- **Critical:** Early morning times format

### Test 9: No Upcoming
- **Hero:** "No Upcoming Baithak Currently" message
- **Past:** 3 events still display
- **Critical:** Graceful fallback, no errors

### Test 10: Missing Fields
- **Hero:** Minimal data, null meal_time shows: "18:00 — Baithak Begins"
- **Past:** 2 events, one with no artists (shows "Various Artists")
- **Critical:** No "null" or "undefined" in UI, no console errors

## 🎨 Visual Validation Points

For each test, verify:

✓ **Colors**
- Orange highlights (#ff8800)
- Gold text (#d4a574, #e6c200)
- Black background (#000000)
- White text (#ffffff)

✓ **Typography**
- League Spartan (headings)
- Lora (body)
- Inter (details)

✓ **Spacing**
- Consistent padding/margins
- Proper line heights
- Element alignment

✓ **Responsive**
- Desktop (1920px)
- Tablet (768px)
- Mobile (375px)

## 🔍 Console Error Check

For EVERY test case, check browser console for:
- ❌ No JavaScript errors
- ❌ No 404 errors for images
- ❌ No JSON parsing errors
- ❌ No undefined variables

## 📝 Testing Workflow

```
1. Open test_validation_dashboard.html
2. For each test case (1-10):
   a. Load the JSON file into your HTML
   b. Visual inspection
   c. Check all relevant checklist items
   d. Test on mobile/tablet views
   e. Verify console is clean
   f. Document any issues
3. Review all checklist items (52 total)
4. Generate final report
```

## 🎓 Quick Commands

### Start Local Server
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

### Access Dashboard
```
http://localhost:8000/test_validation_dashboard.html
```

### Test with Different JSON
```
http://localhost:8000/lrb-fixed-html.html
(manually replace JSON file)
```

## 📈 Success Metrics

✅ **100% Pass Rate:** All 10 test cases pass
✅ **52/52 Checklist:** All validation points checked
✅ **Zero Errors:** No console errors in any test
✅ **Mobile Ready:** Works on all breakpoints
✅ **Performance:** Page loads < 3 seconds

## 🐛 Common Issues Found

Based on similar projects, watch for:
1. Time formatting with <br/> not rendering
2. "View More" button state management
3. Long titles breaking grid on mobile
4. Missing image fallbacks not triggering
5. Null values showing as "null" in UI

## 📞 Next Steps

After completing all tests:
1. ✅ Review all checked items (52 total)
2. 📋 Compile issues found
3. 🔧 Fix critical issues (P0)
4. ✅ Re-test failed cases
5. 📊 Generate final report
6. 🚀 Deploy with confidence!

---

**Total Test Cases:** 10
**Total Validation Points:** 52+
**Estimated Testing Time:** 2-3 hours for thorough testing
**Last Updated:** October 31, 2025
