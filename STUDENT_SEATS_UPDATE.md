# Student Seats Tracking - Code Updates

## Issue Identified

The original implementation was missing **separate tracking for student seats allocation**.

**User's Requirement:**
- Each concert has a FIXED number of student seats (e.g., 10 out of 50 total)
- Student seats are sold at discounted price
- Once student seats are full, no more student bookings accepted
- General seats = Total seats - Student seats

## Changes Required

### 1. Seat Tracking Sheet Structure (COMPLETED ✅)

**Updated columns in `GOOGLE_SHEETS_SETUP_RELATIONAL.md`:**

**OLD Structure:**
```
concert_id | total_seats | booked_seats | available_seats | chairs_total | chairs_booked | chairs_available
```

**NEW Structure:**
```
concert_id | total_seats | general_seats_total | general_seats_booked | general_seats_available | student_seats_total | student_seats_booked | student_seats_available | chairs_total | chairs_booked | chairs_available
```

**Example Data:**
```
CONC004 | 50 | 40 | 12 | 28 | 10 | 3 | 7 | 15 | 5 | 10
```
This means:
- Total capacity: 50 seats
- General allocation: 40 seats (12 booked, 28 available)
- Student allocation: 10 seats (3 booked, 7 available)
- Chairs: 15 total (5 booked, 10 available)

### 2. Google Apps Script Changes Required

#### A. Update `getSeatAvailabilityJSON()` Function

**Location:** Line ~281 in Code.gs

**Change:** Return separate general and student seat data

**BEFORE:**
```javascript
return createResponse({
  concert_id: data[i][0],
  total_seats: data[i][1],
  booked_seats: data[i][2],
  available_seats: data[i][3],
  chairs_total: data[i][4],
  chairs_booked: data[i][5],
  chairs_available: data[i][4] - data[i][5]
});
```

**AFTER:**
```javascript
return createResponse({
  concert_id: data[i][0],
  total_seats: data[i][1],
  general_seats_total: data[i][2],
  general_seats_booked: data[i][3],
  general_seats_available: data[i][4],
  student_seats_total: data[i][5],
  student_seats_booked: data[i][6],
  student_seats_available: data[i][7],
  chairs_total: data[i][8],
  chairs_booked: data[i][9],
  chairs_available: data[i][10]
});
```

#### B. Update `submitBooking()` Function

**Location:** Line ~440 in Code.gs

**Add validation BEFORE accepting booking:**

```javascript
// NEW: Check seat availability BEFORE accepting booking
const concertId = data.concert?.concert_id || 'UNKNOWN';
const generalSeats = data.seats.general || 0;
const studentSeats = data.seats.student || 0;
const chairsRequested = data.seats.chairs || 0;

// Get current seat availability
const availability = JSON.parse(getSeatAvailabilityJSON(concertId).getContent());

// Validate general seats
if (generalSeats > availability.general_seats_available) {
  return createResponse({
    success: false,
    error: `Only ${availability.general_seats_available} general seats available. You requested ${generalSeats}.`
  }, 400);
}

// Validate student seats
if (studentSeats > availability.student_seats_available) {
  return createResponse({
    success: false,
    error: `Only ${availability.student_seats_available} student seats available. You requested ${studentSeats}.`
  }, 400);
}

// Validate chairs
if (chairsRequested > availability.chairs_available) {
  return createResponse({
    success: false,
    error: `Only ${availability.chairs_available} chairs available. You requested ${chairsRequested}.`
  }, 400);
}

// Proceed with booking if all validations pass
```

#### C. Update `updateSeatAvailability()` Function

**Location:** Line ~640 in Code.gs

**Change function signature and implementation:**

**BEFORE:**
```javascript
function updateSeatAvailability(concertId, seatsToBook, chairsToBook) {
  // Update booked_seats (combined)
  sheet.getRange(i + 1, 3).setValue(newBookedSeats);
}
```

**AFTER:**
```javascript
function updateSeatAvailability(concertId, generalSeatsToBook, studentSeatsToBook, chairsToBook) {
  const headers = data[0];

  // Update general seats booked
  const generalBookedCol = headers.indexOf('general_seats_booked') + 1;
  const currentGeneralBooked = data[i][generalBookedCol - 1];
  sheet.getRange(rowNum, generalBookedCol).setValue(currentGeneralBooked + generalSeatsToBook);

  // Update student seats booked
  const studentBookedCol = headers.indexOf('student_seats_booked') + 1;
  const currentStudentBooked = data[i][studentBookedCol - 1];
  sheet.getRange(rowNum, studentBookedCol).setValue(currentStudentBooked + studentSeatsToBook);

  // Update availability columns (if not using formulas)
  const generalTotal = data[i][headers.indexOf('general_seats_total')];
  const studentTotal = data[i][headers.indexOf('student_seats_total')];

  sheet.getRange(rowNum, headers.indexOf('general_seats_available') + 1)
    .setValue(generalTotal - (currentGeneralBooked + generalSeatsToBook));
  sheet.getRange(rowNum, headers.indexOf('student_seats_available') + 1)
    .setValue(studentTotal - (currentStudentBooked + studentSeatsToBook));
}
```

#### D. Update `confirmBooking()` Function

**Location:** Line ~620 in Code.gs

**Change the call to updateSeatAvailability:**

**BEFORE:**
```javascript
updateSeatAvailability(concertId, generalSeats + studentSeats, chairsRequested);
```

**AFTER:**
```javascript
updateSeatAvailability(concertId, generalSeats, studentSeats, chairsRequested);
```

## How to Apply These Changes

### Option 1: Manual Update (Recommended)

1. **Open your deployed Google Apps Script**
   - Go to your Google Sheet
   - Extensions → Apps Script

2. **Update the three functions:**
   - Find `getSeatAvailabilityJSON()` and update return statement
   - Find `submitBooking()` and add validation code at the beginning
   - Find `updateSeatAvailability()` and update entire function
   - Find `confirmBooking()` and update the function call

3. **Save and deploy new version:**
   - Click Save
   - Deploy → Manage deployments → Edit → New version → Deploy

### Option 2: Download Updated Code.gs

I will create a completely updated Code.gs file with all changes incorporated.

**File:** `google_apps_script/Code_v2_StudentSeats.gs`

## Testing the Changes

After updating, test these scenarios:

### Test 1: Student Seats Full

**Setup:**
- Concert has 10 student seats
- 10 student seats already booked
- Student tries to book → Should get error: "Only 0 student seats available"

### Test 2: Student Seats Available

**Setup:**
- Concert has 10 student seats
- 7 student seats booked
- Student tries to book 2 seats → Should succeed

### Test 3: Mixed Booking

**Setup:**
- User books 2 general + 1 student
- Both general_seats_booked AND student_seats_booked should increment
- Availability should update separately

### Test 4: General Seats Full, Student Seats Available

**Setup:**
- 40 general seats (all booked)
- 10 student seats (5 available)
- General user tries to book → Should get error
- Student tries to book → Should succeed

## Benefits of This Change

✅ **Prevents revenue loss** - Limits discounted student tickets
✅ **Fair allocation** - Reserves seats for students at lower price
✅ **Accurate tracking** - Separate counts for general vs student
✅ **Validation** - Rejects bookings that exceed allocation
✅ **Transparency** - Website can show: "5 student seats remaining"

## Updated Concerts Sheet (Optional)

You may also want to add these columns to the Concerts sheet for reference:

```
| student_seats_max | general_seats_max |
|-------------------|-------------------|
| 10                | 40                |
```

This helps when setting up new concerts - you know the allocation policy.

---

**Status:** Documentation complete ✅
**Next Step:** Apply changes to your deployed Code.gs
