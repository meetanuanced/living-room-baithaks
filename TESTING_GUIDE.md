# Booking Flow Testing Guide

## Quick Start Testing Checklist

After deploying fixes, test these scenarios in order:

- [ ] Fresh data load on flow start
- [ ] Zero availability button disabling
- [ ] Checkbox visibility with dynamic availability
- [ ] Concurrent booking validation
- [ ] All entry points work consistently

---

## Test Environment Setup

### Prerequisites

1. **Browser Setup**
   - Use Chrome or Firefox with DevTools (F12)
   - Open 3 tabs for concurrent testing
   - Clear cache before each test session (Ctrl+Shift+Delete)

2. **Console Monitoring**
   - Keep DevTools Console tab open during ALL tests
   - Look for emoji markers: 🎫, 🔄, ✅, ❌, ⚠️
   - Check for errors (red text)

3. **Excel Backend Access**
   - Have your Google Sheet open in a separate window
   - Monitor the **Seat Tracking** tab during tests
   - Check **Bookings** tab after each successful booking

---

## Critical Bug Fix Validation Tests

### Test 1: Fresh Seat Availability on Flow Start (Bug #1 Fix)

**What was broken**: After booking, hero page updated but booking flow used stale cached data.

**How to test**:

1. **Initial State**
   - Set availability in Excel: 2 General, 0 Student, 0 Chairs
   - Refresh page, confirm hero shows "2 seats available"

2. **Make a Booking**
   - Click "Reserve a Seat"
   - Console should show: `🔄 Fetching fresh seat availability...`
   - Book 1 general seat
   - Complete booking
   - Hero should now show "1 seat available"

3. **Update Backend (DO NOT REFRESH PAGE YET)**
   - Go to Excel Seat Tracking
   - Change: `general_seats_booked` from 1 to 0 (freeing up the seat)
   - Change: Add `student_seats_booked` from 0 to 0, add 5 total student seats
   - Change: Add 10 chairs available

4. **Test Fresh Data Fetch**
   - **DO NOT refresh page** (this is the key test!)
   - Click "Reserve a Seat" again
   - **EXPECTED BEHAVIOR**:
     - Console: `🔄 Fetching fresh seat availability...`
     - Console: `Previous availability: { general: 1, student: 0, chairs: 0 }`
     - Console: `Fresh availability: { general: 2, student: 5, chairs: 10 }`
     - Console: `✅ Updated seat availability in booking state`
     - Booking flow should show NEW availability (2 general, 5 student, 10 chairs)
     - Student and chair selectors should be ENABLED

   - **WRONG BEHAVIOR** (old bug):
     - Shows old availability (1 general, 0 student, 0 chairs)
     - Student/chair selectors disabled or missing

**Pass Criteria**: ✅ Booking flow uses fresh data from Excel, not cached page load data

---

### Test 2: Zero Availability Button Disabling (Validation Bug Fix)

**What was broken**: Could select seats/chairs even when 0 available due to `0 || 5` bug.

**How to test**:

1. **Set Zero Availability**
   - Excel: Set all availability to 0
   - Refresh page
   - Click "Reserve a Seat"

2. **Expected Behavior**:
   - Alert: "Sorry, this baithak is completely sold out"
   - Flow does NOT open

3. **Set Mixed Availability**
   - Excel: 5 General, 0 Student, 0 Chairs
   - Refresh page
   - Click "Reserve a Seat"

4. **Expected UI State**:
   - General selector: ENABLED, shows 5 available
   - Student selector:
     - `.unavailable` CSS class applied
     - Opacity 0.5, grayed out
     - + button DISABLED
     - Cannot increase count
   - Chair selector:
     - `.unavailable` CSS class applied
     - Grayed out
     - + button DISABLED

5. **Console Verification**:
   ```
   🔍 Getting seat availability for concert: CONC00X
   ✅ Real seat availability from Excel: {
     general_seats_available: 5,
     student_seats_available: 0,  ← Must be 0, not 5 or 10
     chairs_available: 0           ← Must be 0, not 5 or 10
   }
   ```

6. **Test Button Logic**:
   - Try clicking Student + button → Should do nothing (disabled)
   - Try clicking Chair + button → Should do nothing (disabled)
   - General + button should work normally

**Pass Criteria**:
- ✅ 0 availability correctly treated as unavailable (not as falsy)
- ✅ Buttons disabled when 0 available
- ✅ Visual `.unavailable` class applied

---

### Test 3: Checkbox Visibility with Dynamic Availability (Bug #2 Fix)

**What was broken**: Chair/student checkboxes didn't show up even when available.

**How to test**:

1. **Scenario A: User Selects 0 Chairs, But Chairs Available**
   - Excel: 5 General, 5 Student, 10 Chairs available
   - Click "Reserve a Seat"
   - Step 2: Select 2 General, 0 Student, 0 Chairs
   - Click "Continue to Attendee Details"

   **Expected in Step 3**:
   - ✅ Student checkboxes SHOULD appear (because student seats are available, even though user selected 0)
   - ✅ Chair checkboxes SHOULD appear (because chairs are available, even though user selected 0)
   - Console: Shows both checkboxes rendered

   **Wrong Behavior** (old bug):
   - ❌ Checkboxes don't appear because `bookingState.chairs === 0`

2. **Scenario B: User Selects Chairs, Chairs Available**
   - Step 2: Select 2 General, 1 Student, 2 Chairs
   - Step 3: Both checkboxes should appear

3. **Scenario C: User Selects 0, None Available**
   - Excel: 5 General, 0 Student, 0 Chairs
   - Step 2: Select 2 General only
   - Step 3: No checkboxes should appear (correct)

**Pass Criteria**:
- ✅ Checkboxes show if available OR selected
- ✅ Logic: `(selected > 0 || available > 0)`

---

### Test 4: Re-validation Before Step 3 (Concurrent Booking Protection)

**What this fixes**: Prevents wasting user's time if availability changes mid-booking.

**How to test** (requires 2 browser tabs):

1. **Tab 1**:
   - Excel: 2 General available
   - Start booking
   - Step 2: Select 2 General
   - STOP at Step 2, don't proceed yet

2. **Tab 2**:
   - Open same booking page
   - Start booking
   - Select 2 General
   - Complete entire booking
   - Verify Excel: Now 0 General available

3. **Back to Tab 1**:
   - Click "Continue to Attendee Details"

   **Expected Behavior**:
   - Console: `🔄 Re-validating seat availability before Step 3...`
   - Console: `❌ Seat availability has changed!`
   - Alert: "The seat availability has changed since you started... Only 0 general seats are now available."
   - Automatically goes back to Step 2
   - State reset to 0 selections

   **Wrong Behavior**:
   - Proceeds to Step 3
   - User fills all forms
   - Fails at final submission (wastes time)

**Pass Criteria**:
- ✅ Re-validates before Step 3
- ✅ Detects changes
- ✅ Resets and returns to Step 2

---

## Comprehensive Test Matrix

### Entry Points Testing

Test ALL booking entry points work consistently:

| Entry Point | Location | Test Action | Expected Console Output |
|-------------|----------|-------------|------------------------|
| Hero Button | Homepage, large button | Click "Reserve a Seat" | `🎫 STARTING BOOKING FLOW` |
| Mobile Sticky | Bottom of page on mobile | Click sticky button | Same as above |
| Direct Call | Developer console | `startBookingFlow()` | Same as above |

**All should**:
- Fetch fresh availability
- Apply debouncing (rapid clicks ignored)
- Show prerequisite validation messages
- Open booking flow consistently

---

### Seat Selection Validation Tests

| Scenario | General | Student | Chairs | Expected Behavior |
|----------|---------|---------|--------|-------------------|
| All Available | 10 | 5 | 10 | All selectors enabled |
| Zero General | 0 | 5 | 10 | General disabled, others enabled |
| Zero Student | 10 | 0 | 10 | Student disabled, grayed out |
| Zero Chairs | 10 | 5 | 0 | Chairs disabled, grayed out |
| All Zero | 0 | 0 | 0 | "Sold out" alert, flow doesn't open |
| At Max General | 10 | 5 | 10 | Select 10 general → + button disables |
| Chairs > Seats | 2 | 0 | 10 | Select 2 seats → Chair max becomes 2 |

**For each test**:
1. Set Excel values
2. Refresh page
3. Start booking
4. Verify button states
5. Verify CSS classes (`.unavailable`, `.has-selection`)
6. Check console logs

---

### Checkbox Visibility Matrix

| User Selection | Backend Availability | Student Checkbox? | Chair Checkbox? |
|----------------|---------------------|-------------------|-----------------|
| 0 general | 0 student, 0 chairs | ❌ No | ❌ No |
| 2 general, 0 student, 0 chairs | 0 student, 0 chairs | ❌ No | ❌ No |
| 2 general, 0 student, 0 chairs | 5 student, 10 chairs | ✅ Yes | ✅ Yes |
| 2 general, 1 student, 0 chairs | 0 student, 10 chairs | ✅ Yes | ✅ Yes |
| 2 general, 0 student, 2 chairs | 5 student, 0 chairs | ✅ Yes | ✅ Yes |
| 2 general, 1 student, 1 chair | 5 student, 10 chairs | ✅ Yes | ✅ Yes |

---

### Concurrent Booking Tests (3-Tab Testing)

**Setup**: Excel has 5 General, 5 Student, 10 Chairs available

#### Test 1: Race Condition for Last Seats

1. **All 3 Tabs**: Start booking simultaneously
2. **Tab 1**: Select 3 General → Submit immediately
3. **Tab 2**: Select 2 General → Wait at Step 3
4. **Tab 3**: Select 2 General → Try to proceed to Step 3

**Expected**:
- Tab 1: Success (5 → 2 remaining)
- Tab 2: Success if submitted before Tab 3 (2 → 0 remaining)
- Tab 3:
  - If after Tab 2 submits: Alert "availability changed" at Step 3
  - If tries to submit when 0 left: Backend rejects with error

#### Test 2: Multiple Users Selecting Same Seats

1. **Tab 1, 2, 3**: All select 5 General each (more than available)
2. **Tab 1**: Submit first → Should succeed (5 → 0)
3. **Tab 2**: Try to proceed to Step 3 → Re-validation catches it, resets
4. **Tab 3**: Same as Tab 2

**Expected**:
- Only first submission succeeds
- Others get caught by re-validation
- Backend provides final validation (double-check)

---

## Edge Cases and Boundary Tests

### Edge Case 1: Page Load Race Condition
- Scenario: User clicks "Reserve a Seat" before concert data loads
- Expected: Waits up to 5 seconds for data, then shows error if still not loaded

### Edge Case 2: Network Failure During Availability Fetch
- Scenario: Disconnect internet, click "Reserve a Seat"
- Expected: Error alert "Unable to start booking. Please check your internet connection"

### Edge Case 3: Rapid Double-Clicking
- Scenario: Double-click "Reserve a Seat" very fast
- Expected: Only one flow starts, second click ignored (debouncing)
- Console: `⚠️ Booking flow already starting, ignoring duplicate request`

### Edge Case 4: Sold Out Mid-Flow
- Scenario: Availability becomes 0 after user starts but before Step 3
- Expected: Re-validation catches it, resets to Step 2

### Edge Case 5: Negative Availability (Data Integrity)
- Scenario: Manually set booked > total in Excel
- Expected: Formula shows negative or 0, booking prevents selection

---

## Console Log Verification

### Expected Console Flow for Successful Booking

```
========================================
🎫 STARTING BOOKING FLOW
========================================
⏳ Debounce check: Not currently starting
✅ Concert data already loaded: CONC004 Hindustani Classical Night
🔄 Fetching fresh seat availability...
   Previous availability: { general: 10, student: 5, chairs: 10 }
📡 API Call: getSeatAvailability(CONC004)
   Fresh availability: { general: 8, student: 3, chairs: 7 }
   Total available: 11 seats
✅ Updated seat availability in booking state
🔄 Resetting booking selections (fresh start)
✅ Booking flow opened
========================================

[User selects 2 General, 0 Student, 1 Chair]

🔄 Re-validating seat availability before Step 3...
📡 API Call: getSeatAvailability(CONC004)
✅ Validation passed: { general: 8 >= 2, student: 3 >= 0, chairs: 7 >= 1 }
🎫 Proceeding to Step 3

[User fills attendee forms and submits]

📤 BOOKING SUBMISSION STARTING
✅ Response status: 200 OK
✅ Booking successful: BK_1234567890
🔄 Refreshing seat availability after booking...
📡 API Call: getSeatAvailability(CONC004)
✅ Hero updated: Now showing 9 seats available
```

### Error Console Patterns to Watch For

**Bad Pattern** (old bug):
```
❌ Fresh availability: { general: 10, student: 0, chairs: 0 }
❌ User selected 2 chairs but availability = 0
❌ Should have been prevented!
```

**Good Pattern** (fixed):
```
✅ Fresh availability: { general: 10, student: 0, chairs: 0 }
✅ Chair selector disabled (unavailable class applied)
✅ Cannot select chairs
```

---

## Regression Testing

After ANY future code changes, run this regression suite:

### 15-Minute Quick Regression
1. Fresh data load test (Test 1)
2. Zero availability test (Test 2)
3. Checkbox visibility test (Test 3)
4. One complete booking end-to-end

### 45-Minute Full Regression
- All Critical Bug Fix Tests (1-4)
- Entry Points Testing (all 3 points)
- Seat Selection Matrix (7 scenarios)
- Checkbox Visibility Matrix (6 scenarios)
- One concurrent booking test (2 tabs)

---

## Manual Testing Scripts

### Script 1: Zero to Hero Test

```
1. Excel: Set all to 0
2. Refresh page → Should show "Sold Out"
3. Try booking → Alert "sold out", doesn't open
4. Excel: Add 10 general, 5 student, 10 chairs
5. DON'T REFRESH - click booking button
6. Should fetch fresh data and show all available
7. Select 5 general, 2 student, 3 chairs
8. Complete booking
9. Excel: Verify numbers updated
10. Hero: Shows reduced availability
```

### Script 2: Checkbox Persistence Test

```
1. Excel: 5 general, 0 student, 0 chairs
2. Start booking, select 2 general
3. Step 3: No checkboxes (correct)
4. Go back to Step 2
5. Excel: Add 10 chairs (don't refresh page!)
6. Start NEW booking flow
7. Select 2 general, 0 chairs
8. Step 3: Chair checkbox SHOULD appear now
```

### Script 3: Concurrent Booking Test

```
Tab 1:
1. Excel: 3 general available
2. Start booking, select 3 general
3. STOP at Step 2

Tab 2:
4. Start booking, select 2 general
5. Complete entire booking
6. Excel: Now 1 general left

Tab 1:
7. Click "Continue to Attendee Details"
8. Should show alert "availability changed"
9. Reset to 0 selections
10. Can now select max 1 general
```

---

## Performance Benchmarks

Expected timings (measure with console timestamps):

- Page load to concert data ready: < 2 seconds
- Booking flow start (fresh availability fetch): < 1 second
- Step 2 to Step 3 (re-validation): < 1 second
- Final submission: < 3 seconds
- Hero refresh after booking: < 1 second

If any exceed these times, check:
1. Network speed
2. Google Apps Script response time
3. Excel sheet size/complexity

---

## Troubleshooting Test Failures

### Issue: Fresh data not loading
**Check**:
- Console shows `🔄 Fetching fresh seat availability...`
- API_URL in config.js is correct
- Web App deployment is latest version
- CORS proxy running (if using local proxy)

### Issue: Buttons not disabling at 0
**Check**:
- Console shows availability as 0 (not undefined)
- CSS `.unavailable` class is applied (inspect element)
- Using `??` not `||` in code

### Issue: Checkboxes not appearing
**Check**:
- Console log `seatAvailability` object
- Condition checks availability: `bookingState.seatAvailability?.chairs_available > 0`
- Not just checking user selection: `bookingState.chairs > 0`

### Issue: Re-validation not working
**Check**:
- Console shows `🔄 Re-validating...` before Step 3
- `revalidateAndProceedToStep3()` is being called
- Not using old `goToStep(3)` directly

---

## Success Criteria Summary

All fixes are working correctly when:

✅ **Bug #1 Fixed**: Fresh data loaded on every booking start, not stale page load data
✅ **Bug #2 Fixed**: Checkboxes appear based on availability, not just user selection
✅ **Validation Fixed**: 0 treated as unavailable (not falsy), buttons disabled
✅ **UX Improved**: `.unavailable` class grays out disabled selectors
✅ **Concurrency Handled**: Re-validation prevents race conditions
✅ **Debouncing Works**: Rapid clicks don't cause multiple flows
✅ **All Entry Points Consistent**: Hero button, mobile button, etc. all work same way
✅ **Console Logs Clear**: Emoji markers show flow status at every step
✅ **Excel Updates Correctly**: Only booked columns update, formulas preserved

---

## Next Steps After Testing

1. **If All Tests Pass**:
   - Mark Phase 1 complete
   - Begin Phase 2 (UX polish, custom modals)
   - Schedule weekly regression tests

2. **If Tests Fail**:
   - Document exact failure scenario
   - Share console logs (include full context)
   - Share Excel state (screenshot of Seat Tracking tab)
   - Note which browser/device
   - Provide exact steps to reproduce

3. **Performance Issues**:
   - Use Chrome DevTools Network tab
   - Check API response times
   - Monitor Google Apps Script quota usage

---

## Testing Tools Reference

- **Chrome DevTools**: F12 → Console tab
- **Network Monitoring**: F12 → Network tab
- **Element Inspection**: Right-click element → Inspect
- **Clear Cache**: Ctrl+Shift+Delete (Chrome/Firefox)
- **Mobile Testing**: F12 → Toggle device toolbar
- **Console Search**: Ctrl+F in console to find specific log

---

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Related Docs**:
- `DEBUGGING_GUIDE.md` - Configuration and log viewing
- `CONFIG_TAB_GUIDE.md` - Backend configuration
- Phase 1 Implementation Plan in conversation history
