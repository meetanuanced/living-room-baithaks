# Validation Fix Testing - Chair & Student Allocation

## What Was Fixed

### Issue #1: Missing Chair/Student Allocation Validation ✅ FIXED

**Before Fix:**
- User could select 4 chairs in Step 2
- User could proceed to Step 3, fill all forms
- User could skip checking "Need a Chair" boxes
- System would send payload with `seats.chairs: 0`
- Booking would save with incorrect data

**After Fix:**
- System validates before Step 4 (Payment)
- If chairs selected ≠ chairs allocated → BLOCKS with clear error
- If student seats selected ≠ student tickets allocated → BLOCKS with clear error
- User MUST fix allocation before proceeding

### Issue #2: Only 1 Attendee Saved ✅ IMPROVED

**Before:**
- Backend tried to write all attendees
- Silent failure after 1st row (no error logging)
- Impossible to diagnose root cause

**After:**
- Individual try-catch for each attendee row
- Detailed logging for each write attempt
- Tracks successful writes vs failures
- Throws error if ZERO rows saved (critical)
- Warns if partial failure

---

## Test Scenario 1: Chair Allocation Mismatch (Your Exact Bug)

### Setup:
- Excel: 10 General, 5 Student, 10 Chairs available

### Steps:
1. Start booking flow
2. **Step 2**: Select 2 General, 3 Student, 4 Chairs → Total: 5 seats, 4 chairs
3. **Step 3**: Fill names for all 5 attendees
4. **Step 3**: Check "Student Ticket" for 3 attendees (correct)
5. **Step 3**: Check "Need a Chair" for ONLY 0 attendees (WRONG - should be 4)
6. Click "Continue to Payment"

### Expected Behavior:
❌ **BLOCKED!** Alert shows:

```
You selected 4 chairs in Step 2, but only allocated 0 chairs.

Please check the "Need a Chair" box for exactly 4 attendees.
```

User stays on Step 3, cannot proceed until 4 chairs are checked.

### Console Output:
```
🔍 VALIDATING ATTENDEE DETAILS
📊 Allocation Check:
   Selected in Step 2: 3 student, 4 chairs
   Allocated in Step 3: 3 student, 0 chairs
❌ Chair allocation mismatch: Expected 4, got 0
❌ Validation failed
```

---

## Test Scenario 2: Student Allocation Mismatch

### Setup:
- Excel: 10 General, 5 Student, 10 Chairs available

### Steps:
1. Start booking flow
2. **Step 2**: Select 3 General, 2 Student, 0 Chairs
3. **Step 3**: Fill names for all 5 attendees
4. **Step 3**: Check "Student Ticket" for ONLY 1 attendee (WRONG - should be 2)
5. Click "Continue to Payment"

### Expected Behavior:
❌ **BLOCKED!** Alert shows:

```
You selected 2 student seats in Step 2, but only marked 1 attendee as student.

Please check the "Student Ticket" box for exactly 2 attendees.
```

---

## Test Scenario 3: Over-allocation (Too Many Checked)

### Setup:
- Excel: 10 General, 5 Student, 10 Chairs available

### Steps:
1. Start booking flow
2. **Step 2**: Select 4 General, 1 Student, 2 Chairs
3. **Step 3**: Fill names for all 5 attendees
4. **Step 3**: Check "Student Ticket" for 3 attendees (WRONG - only selected 1)
5. Click "Continue to Payment"

### Expected Behavior:
❌ **BLOCKED!** Alert shows:

```
You marked 3 attendees as student, but only selected 1 student seat in Step 2.

Please uncheck some "Student Ticket" boxes or go back to Step 2 to select more student seats.
```

---

## Test Scenario 4: Correct Allocation (Should Pass)

### Setup:
- Excel: 10 General, 5 Student, 10 Chairs available

### Steps:
1. Start booking flow
2. **Step 2**: Select 2 General, 3 Student, 4 Chairs → Total: 5 seats, 4 chairs
3. **Step 3**: Fill names for all 5 attendees
4. **Step 3**: Check "Student Ticket" for exactly 3 attendees ✓
5. **Step 3**: Check "Need a Chair" for exactly 4 attendees ✓
6. Click "Continue to Payment"

### Expected Behavior:
✅ **PASSES!** Proceeds to Step 4 (Payment)

### Console Output:
```
🔍 VALIDATING ATTENDEE DETAILS
📊 Allocation Check:
   Selected in Step 2: 3 student, 4 chairs
   Allocated in Step 3: 3 student, 4 chairs
✅ All validations passed
```

---

## Test Scenario 5: Edge Case - More Chairs Than Attendees

### Setup:
- Excel: 10 General, 5 Student, 10 Chairs available

### Steps:
1. Start booking flow
2. **Step 2**: Select 3 General, 0 Student, 0 Chairs
3. **Step 3**: Somehow check "Need a Chair" for 4 attendees (more than 3 total)

### Expected Behavior:
❌ **BLOCKED!** Alert shows:

```
You cannot allocate more chairs (4) than total attendees (3).

Please uncheck some "Need a Chair" boxes.
```

**Note**: This shouldn't happen normally because the checkbox disabled logic prevents it, but validation catches it as a safeguard.

---

## Test Scenario 6: Attendee Save Issue (Backend Debugging)

This test checks if the backend logging improvements help diagnose the "only 1 attendee saved" issue.

### Setup:
- Excel: 10 General, 5 Student, 10 Chairs available

### Steps:
1. Start booking flow
2. **Step 2**: Select 2 General, 3 Student, 4 Chairs
3. **Step 3**: Fill all forms correctly, allocate 3 student + 4 chairs correctly
4. **Step 4**: Upload screenshot, enter transaction ID
5. **Step 5**: Click "Confirm Booking"

### Expected Behavior:
✅ Booking succeeds

### Backend Logs to Check:
Go to Google Apps Script → Executions → View latest execution

**Look for**:
```
✍ Writing to BOOKING_ATTENDEES sheet:
   Attempting Row 1/5: [LRB1234, ATT001, Student, Yes, Yes]
   ✓ Row 1 written successfully
   Attempting Row 2/5: [LRB1234, ATT002, Student, Yes, No]
   ✓ Row 2 written successfully
   Attempting Row 3/5: [LRB1234, ATT003, Student, Yes, No]
   ✓ Row 3 written successfully
   Attempting Row 4/5: [LRB1234, ATT004, General, Yes, No]
   ✓ Row 4 written successfully
   Attempting Row 5/5: [LRB1234, ATT005, General, No, No]
   ✓ Row 5 written successfully
✓ Successfully added 5/5 rows to BOOKING_ATTENDEES sheet
```

**If you see**:
```
✓ Successfully added 1/5 rows to BOOKING_ATTENDEES sheet
⚠️ WARNING: Only 1/5 attendee rows were saved successfully
```

**Then check above for**:
```
❌ ERROR writing Row 2: [error message here]
❌ Failed data: bookingId=..., attendeeId=..., ...
```

This will tell us WHY rows 2-5 failed to save.

---

## Validation Logic Reference

The new validation checks (scripts/booking-flow.js:868-917):

```javascript
// Count actual selections
const actualStudentSeats = bookingState.attendees.filter(a => a.type === 'Student').length;
const actualChairsAllocated = bookingState.attendees.filter(a => a.needsChair).length;

// Validate student allocation
if (bookingState.studentSeats > 0 && actualStudentSeats !== bookingState.studentSeats) {
    alert('Mismatch error...');
    return false;
}

// Validate chair allocation
if (bookingState.chairs > 0 && actualChairsAllocated !== bookingState.chairs) {
    alert('Mismatch error...');
    return false;
}

// Validate constraints
if (actualStudentSeats > totalSeats) { ... }
if (actualChairsAllocated > totalSeats) { ... }
```

---

## Common Validation Messages

### Chair Messages:

**Too Few Chairs Allocated:**
```
You selected 4 chairs in Step 2, but only allocated 2 chairs.

Please check the "Need a Chair" box for exactly 4 attendees.
```

**Too Many Chairs Allocated:**
```
You allocated 5 chairs, but only selected 3 chairs in Step 2.

Please uncheck some "Need a Chair" boxes or go back to Step 2 to select more chairs.
```

**Chairs > Attendees:**
```
You cannot allocate more chairs (6) than total attendees (5).

Please uncheck some "Need a Chair" boxes.
```

### Student Messages:

**Too Few Students:**
```
You selected 3 student seats in Step 2, but only marked 1 attendee as student.

Please check the "Student Ticket" box for exactly 3 attendees.
```

**Too Many Students:**
```
You marked 4 attendees as student, but only selected 2 student seats in Step 2.

Please uncheck some "Student Ticket" boxes or go back to Step 2 to select more student seats.
```

**Students > Total Seats:**
```
You cannot have more student tickets (6) than total seats (5).

Please uncheck some "Student Ticket" boxes.
```

---

## Success Criteria

All fixes working correctly when:

✅ **Validation prevents mismatched allocations** - Cannot proceed from Step 3 if chairs/students don't match Step 2
✅ **Clear, actionable error messages** - User knows exactly what to fix
✅ **Console logs show validation details** - Easy to debug issues
✅ **Backend logs each attendee write attempt** - Can diagnose partial save failures
✅ **All 5 attendees save to Excel** - No more "only 1 row saved" issue

---

## Troubleshooting

### Issue: Validation fires but user can still proceed
**Check**: Make sure validateAttendeeDetails() returns false and the continue button logic checks this

### Issue: Checkboxes are disabled when they shouldn't be
**Check**: updateCheckboxStates() logic at booking-flow.js:742-769

### Issue: Still only 1 attendee saving
**Check**: Google Apps Script execution logs for the detailed error messages from the try-catch blocks

### Issue: Backend throws critical error "Failed to save attendee data"
**This is GOOD** - It means the backend detected the problem and refused to save corrupt data. Check execution logs for root cause.

---

## Files Modified

1. **scripts/booking-flow.js** (lines 807-931)
   - Added comprehensive validation in `validateAttendeeDetails()`
   - Validates chair allocation matches
   - Validates student seat allocation matches
   - Validates constraints (chairs ≤ attendees, students ≤ total)
   - Clear error messages for each scenario

2. **google_apps_script/Code.gs** (lines 658-704)
   - Added individual try-catch for each attendee row
   - Added data validation before writing
   - Tracks successful writes vs failures
   - Detailed error logging for debugging
   - Throws error if zero rows saved
   - Warns if partial failure

---

## Next Steps After Testing

1. **Test Scenario 1** (your exact bug) → Should now be blocked
2. **Test Scenario 4** (correct allocation) → Should pass smoothly
3. **Test Scenario 6** (backend logging) → Check if all 5 attendees save
4. **If Issue Persists**: Share Google Apps Script execution logs (especially the "Attempting Row X/Y" lines)

---

**Document Version**: 1.0
**Created**: 2025-11-07
**Related**: TESTING_GUIDE.md, DEBUGGING_GUIDE.md
