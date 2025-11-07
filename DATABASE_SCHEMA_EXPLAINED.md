# Database Schema & Attendee Linking Explained

## Your Questions Answered

### 1. "Preferences should be stored in one place, not in both Attendees and Booking_Attendees?"

**Answer**: You're correct! Let me clarify what should be stored where:

---

## ✅ Correct Database Design

### **Attendees Sheet** (Master Table - Permanent Data)
**Purpose**: Stores permanent information about people

| Column | What It Stores | Example | Why Here? |
|--------|----------------|---------|-----------|
| `attendee_id` | Unique person ID | ATT_123 | Primary key |
| `name` | Person's name | "John Doe" | Permanent identity |
| `whatsapp` | WhatsApp number | "+919999999999" | Contact info (permanent) |
| `email` | Email address | "john@email.com" | Contact info (permanent) |
| `total_concerts_attended` | History counter | 5 | Lifetime stat |
| `first_concert_id` | First concert attended | CONC001 | History |
| `last_concert_id` | Most recent concert | CONC005 | History |

**What should NOT be here**:
- ❌ `seat_type` - This changes per booking! (Sometimes General, sometimes Student)
- ❌ `needs_chair` - This changes per booking! (May need chair at one concert but not another)

**Currently WRONG**:
```
attendee_id | name     | whatsapp      | seat_type | needs_chair
ATT_001     | John Doe | +919999999999 | General   | No
```

**Should be**:
```
attendee_id | name     | whatsapp      | total_concerts | first_concert | last_concert
ATT_001     | John Doe | +919999999999 | 5              | CONC001       | CONC005
```

---

### **Booking_Attendees Sheet** (Junction Table - Per-Booking Data)
**Purpose**: Links bookings to attendees + stores booking-specific preferences

| Column | What It Stores | Example | Why Here? |
|--------|----------------|---------|-----------|
| `booking_id` | Which booking | LRB5904 | Foreign key to Bookings |
| `attendee_id` | Which person | ATT_123 | Foreign key to Attendees |
| `seat_type` | Seat type **for THIS booking** | "Student" | Changes per booking |
| `needs_chair` | Chair needed **for THIS booking** | "Yes" | Changes per booking |
| `is_main_contact` | Main contact **for THIS booking** | "Yes" | Booking-specific |

**Why seat_type and needs_chair go here**:
- John may book a **General** seat for Concert 1
- John may book a **Student** seat for Concert 2 (if he becomes a student)
- John may need a **chair** at Concert 1 (injured)
- John may NOT need a **chair** at Concert 2 (recovered)

**Example**:
```
booking_id | attendee_id | seat_type | needs_chair | is_main_contact
LRB5904    | ATT_001     | Student   | Yes         | Yes         ← Concert 1: Student, needs chair
LRB6000    | ATT_001     | General   | No          | Yes         ← Concert 2: General, no chair
```

---

### **Bookings Sheet** (Master Table - Booking Transactions)
**Purpose**: Stores booking transaction details

| Column | What It Stores | Example | Why Here? |
|--------|----------------|---------|-----------|
| `booking_id` | Unique booking ID | LRB5904 | Primary key |
| `transaction_id` | Payment transaction ID | LRB5904 | Payment reference |
| `concert_id` | Which concert | CONC004 | Foreign key |
| `general_seats` | How many general seats booked | 2 | Transaction detail |
| `student_seats` | How many student seats booked | 3 | Transaction detail |
| `chairs` | How many chairs requested | 4 | Transaction detail |
| `total_amount` | Total price paid | ₹3500 | Financial record |
| `main_contact_attendee_id` | Primary contact person | ATT_123 | Who to contact |
| `booking_status` | Current status | "pending" | Workflow state |

---

## ❌ Current Problem (What Needs to be Fixed)

Right now, the **Attendees** sheet has columns that should NOT be there:

**Current Attendees Sheet Structure** (WRONG):
```
attendee_id | name | whatsapp | email | seat_type | needs_chair | first_concert_id | ...
```

**Should be** (CORRECT):
```
attendee_id | name | whatsapp | email | total_concerts_attended | first_concert_id | last_concert_id | notes
```

**Why?**
- `seat_type` and `needs_chair` are **per-booking preferences**, not permanent attributes
- These should ONLY exist in `Booking_Attendees` sheet

---

## 🔄 How Returning Attendees Should Work

### Current Broken Logic:
1. User books a seat
2. Frontend sends: `{name: "John", whatsapp: "+919999999999", seatType: "Student", needsChair: true}`
3. Backend searches Attendees sheet by WhatsApp
4. **IF FOUND**: Reuses existing `attendee_id` (correct!)
5. **BUT**: Overwrites `seat_type` and `needs_chair` in Attendees sheet (WRONG!)

### Your Correct Understanding:
> "If an attendee comes again how do we link it to previous attendee whose data we have collected already it maybe best to get data of each attendee uniquely every time for every concert till we build intelligence please advise."

**You're absolutely right!** Here's the correct approach:

---

## ✅ Recommended Fix (Two Options)

### **Option 1: Keep Relational Design (Simple Fix)**

**What to do:**
1. **Remove** `seat_type` and `needs_chair` columns from `Attendees` sheet
2. Keep these ONLY in `Booking_Attendees` sheet
3. Update `findOrCreateAttendee()` to NOT save these fields to Attendees

**How it works**:
1. User books Concert 1:
   - Create `ATT_001` in Attendees: `{name: "John", whatsapp: "+919999999999"}`
   - Create link in Booking_Attendees: `{booking_id: LRB5904, attendee_id: ATT_001, seat_type: "Student", needs_chair: "Yes"}`

2. User books Concert 2 (returning attendee):
   - Search Attendees by WhatsApp → FOUND `ATT_001`
   - **Reuse same attendee_id** ✅
   - Create NEW link in Booking_Attendees: `{booking_id: LRB6000, attendee_id: ATT_001, seat_type: "General", needs_chair: "No"}`

**Result**:
- ✅ One person record in Attendees
- ✅ Multiple booking records linked to same person
- ✅ Each booking has its own preferences
- ✅ Can track: "John attended 5 concerts" (count Booking_Attendees rows)

---

### **Option 2: Collect Unique Data Every Time (Simpler, What You Suggested)**

**What to do:**
1. **Always create NEW attendee record** for each booking
2. Don't search for existing attendees
3. Don't try to link returning attendees

**How it works**:
1. User books Concert 1:
   - Create `ATT_001`: `{name: "John", whatsapp: "+919999999999", seat_type: "Student", needs_chair: "Yes"}`
   - Link: `{booking_id: LRB5904, attendee_id: ATT_001}`

2. User books Concert 2 (same person, but treated as new):
   - Create `ATT_002`: `{name: "John", whatsapp: "+919999999999", seat_type: "General", needs_chair: "No"}`
   - Link: `{booking_id: LRB6000, attendee_id: ATT_002}`

**Result**:
- ✅ Simple: No lookup logic needed
- ✅ Each booking is completely independent
- ✅ No risk of data corruption
- ❌ Can't track returning attendees (John appears as 2 different people)
- ❌ Duplicated contact info

---

## 🎯 My Recommendation: **Option 1 (Fixed Relational Design)**

**Why?**
- You get attendee history: "John has attended 5 concerts"
- You can send personalized emails: "Welcome back, John! This is your 3rd baithak"
- Less data duplication
- Easier to manage contact lists
- Prepare for future intelligence

**What needs to be fixed**:
1. Remove `seat_type` and `needs_chair` from Attendees sheet structure
2. Update `findOrCreateAttendee()` to not write these fields:
   ```javascript
   // Before (WRONG):
   sheet.appendRow([
       attendeeId, name, whatsapp, email,
       studentStatus,  // ← REMOVE THIS
       needsChair ? 'Yes' : 'No',  // ← REMOVE THIS
       '', '', 0, '', '', ''
   ]);

   // After (CORRECT):
   sheet.appendRow([
       attendeeId, name, whatsapp, email,
       0,   // total_concerts_attended
       '',  // first_concert_id
       '',  // first_concert_date
       '',  // last_concert_id
       '',  // last_concert_date
       ''   // notes
   ]);
   ```

3. Booking-specific data (`seat_type`, `needs_chair`) ONLY goes to `Booking_Attendees`

---

## 🔍 Current Bug (The One We Just Fixed)

**Problem**: Additional attendees (without WhatsApp) were reusing the same attendee ID

**Root Cause**: Backend searched for attendees with empty WhatsApp and found old record

**Fix Applied**: Only search by WhatsApp if WhatsApp is provided. Otherwise, always create new attendee.

**But**: This means additional attendees (without WhatsApp) will NEVER be linked as returning attendees.

**Solution for Long Term**:
- **Option A**: Require WhatsApp for all attendees (recommended for linking)
- **Option B**: Use Option 2 above (no linking, always new records)

---

## 📋 Summary

### What You Asked:
> "preferences of each attendee and category of attendees should be stored in one place and linking sheet should only connect them right we seem to be storing name etc in one list and preferences in another"

### Answer:
**You're RIGHT!** Here's the correct split:

**Attendees** (permanent data):
- ✅ `name`
- ✅ `whatsapp`
- ✅ `email`
- ✅ `total_concerts_attended`
- ❌ NOT `seat_type` (per-booking preference)
- ❌ NOT `needs_chair` (per-booking preference)

**Booking_Attendees** (per-booking data):
- ✅ Links `booking_id` to `attendee_id`
- ✅ `seat_type` (for THIS booking)
- ✅ `needs_chair` (for THIS booking)
- ✅ `is_main_contact` (for THIS booking)

### What You Asked About Linking:
> "If an attendee comes again how do we link it to previous attendee"

**Answer**: Search by WhatsApp number. If found, reuse `attendee_id`. If not found, create new.

**BUT**: For this to work, you need:
1. WhatsApp for all attendees (currently only main attendee has it)
2. OR: Accept that additional attendees won't be linked

### What You Suggested:
> "it maybe best to get data of each attendee uniquely every time for every concert till we build intelligence"

**Answer**: This is **Option 2** above. It's simpler and will work fine for now. You can always add intelligence later by:
1. Matching names + approximate dates
2. Asking user: "Are you the same John Doe who attended Concert 001?"
3. Manual linking in future

---

## 🚀 Next Steps

**Immediate (Code Changes)**:
1. Remove `seat_type` and `needs_chair` columns from Attendees sheet
2. Update `findOrCreateAttendee()` to not save these fields
3. Ensure these fields ONLY go to `Booking_Attendees` sheet

**Future (Intelligence)**:
1. Require WhatsApp for all attendees (adds input field)
2. OR: Match returning attendees by name + email
3. OR: Ask users: "Have you attended before?"

**For Now** (Keep It Simple):
- Current fix (unique attendees for those without WhatsApp) works fine
- Main attendee linking works (has WhatsApp)
- Build intelligence later when you have more data

---

**Last Updated**: 2025-11-07
**Related**: The bug fix we just pushed addresses the immediate issue of attendee ID reuse.
