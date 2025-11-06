# Living Room Baithaks - Classical Music Concert Website

> **Automated booking system with Google Sheets backend**

A website for managing classical music concerts (Baithaks) with automated booking management, master attendee tracking, and real-time seat availability.

---

## 🚀 Quick Start

### **1. For Website Setup (Already Done ✅)**

Your website is ready at `index.html`. The website displays concerts and handles bookings.

**Current Setup:**
- ✅ Website files (index.html, styles/, scripts/, Images/, Videos/)
- ✅ Your concert data in `data/lrb_concerts_master_final_updated.json`
- ✅ Original Excel data in `data/LRB_Master_Data.xlsx`

### **2. For Backend Setup (Next Step - Follow Migration Guide)**

To enable automated bookings and attendee tracking:

👉 **Read: [`docs/MIGRATION_GUIDE.md`](docs/MIGRATION_GUIDE.md)**

This guide walks you through:
- Creating Google Sheets database (8 tables)
- Deploying Google Apps Script backend
- Connecting website to live data
- Migrating your existing concert data

---

## 📁 Repository Structure

```
living-room-baithaks/
├── README.md                 ← You are here
├── index.html                ← Main website
├── styles/                   ← CSS files
├── scripts/                  ← JavaScript files
├── Images/                   ← Concert images
├── Videos/                   ← Concert videos
├── data/                     ← Your data files
│   ├── lrb_concerts_master_final_updated.json
│   └── LRB_Master_Data.xlsx
├── docs/                     ← All documentation
│   ├── MIGRATION_GUIDE.md   ← START HERE for backend setup
│   ├── GOOGLE_SHEETS_SETUP_RELATIONAL.md
│   ├── STUDENT_SEATS_UPDATE.md
│   └── ...
└── google_apps_script/       ← Backend code to deploy
    ├── Code.gs              ← Deploy this to Google Sheet
    └── README.md            ← API documentation
```

---

## 📚 Documentation Guide

### **If You Want to Set Up the Full Automated System:**

**Read in this order:**

1. **[`docs/MIGRATION_GUIDE.md`](docs/MIGRATION_GUIDE.md)** ← Start here!
   - Complete step-by-step migration process
   - How to create Google Sheets database
   - How to deploy Google Apps Script
   - How to connect website to backend

2. **[`docs/STUDENT_SEATS_UPDATE.md`](docs/STUDENT_SEATS_UPDATE.md)** ← Important fix!
   - Explains separate student seat allocation
   - Prevents unlimited student discount bookings
   - Required updates to Code.gs

3. **[`docs/GOOGLE_SHEETS_SETUP_RELATIONAL.md`](docs/GOOGLE_SHEETS_SETUP_RELATIONAL.md)**
   - Detailed database structure (8 tables)
   - Column definitions and examples
   - Data validation setup

### **If You Just Want to Understand the System:**

- **[`docs/IMPLEMENTATION_SUMMARY_RELATIONAL.md`](docs/IMPLEMENTATION_SUMMARY_RELATIONAL.md)**
  - Complete overview of everything
  - Design decisions explained
  - Benefits breakdown

- **[`google_apps_script/README.md`](google_apps_script/README.md)**
  - API endpoints documentation
  - Deployment instructions
  - Troubleshooting guide

---

## ✨ What This System Does

### **Current (Static Website):**
- ✅ Displays concerts from JSON file
- ✅ Shows past events
- ✅ Hero section with upcoming concert
- ❌ No booking management
- ❌ No attendee tracking

### **After Migration (Automated):**
- ✅ Displays concerts from Google Sheets (live data)
- ✅ Real-time seat availability (general + student separate)
- ✅ Automated booking submissions
- ✅ Master attendees database (tracks repeat guests)
- ✅ Payment screenshot uploads to Google Drive
- ✅ Separate tracking for general vs student seats
- ✅ No manual JSON updates needed

---

## 🎯 Key Features

### **Database Structure (Relational)**
- **8 interconnected Google Sheets tables:**
  1. **Artists** - All artists (linked to concerts)
  2. **Concerts** - Concert details
  3. **Attendees** - Master list (tracks lifetime attendance)
  4. **Bookings** - Booking transactions
  5. **Booking_Attendees** - Junction table (each person in group bookings)
  6. **Seat Tracking** - Real-time availability (general + student separate!)
  7. **Payment Logs** - Audit trail
  8. **Config** - System settings

### **Student Seat Allocation (Important!)**
Each concert has:
- **Total seats:** e.g., 50
- **General seats:** e.g., 40 (full price)
- **Student seats:** e.g., 10 (discounted - CAPPED to prevent revenue loss!)
- **Chairs:** e.g., 15

This prevents unlimited student discount bookings.

### **Master Attendees Tracking**
- Every person who books gets a unique attendee ID
- Tracks: total_concerts_attended, first/last concert dates
- Enables:
  - Identifying loyal audience members
  - Pre-filling forms for returning guests
  - Targeted communications
  - Lifetime analytics

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Backend:** Google Apps Script
- **Database:** Google Sheets (8 relational tables)
- **Storage:** Google Drive (payment screenshots)
- **Deployment:** Netlify / GitHub Pages (website)

---

## 📖 API Endpoints (After Backend Setup)

```
GET  /exec?action=getConcerts
     → Returns concerts with embedded artists array

GET  /exec?action=getSeatAvailability&concertId=CONC001
     → Live seat availability (general + student separate)

GET  /exec?action=getAttendee&whatsapp=+919876543210
     → Lookup attendee by phone

POST /exec?action=submitBooking
     → Complete booking with automatic attendee tracking
```

See [`google_apps_script/README.md`](google_apps_script/README.md) for full API documentation.

---

## 🚦 Getting Started

### **Step 1: Review Your Current Setup**

```bash
# Check your website files
ls -la index.html styles/ scripts/ Images/ Videos/

# Check your data
ls -la data/

# Read your current concert data
cat data/lrb_concerts_master_final_updated.json
```

### **Step 2: Read the Migration Guide**

```bash
cat docs/MIGRATION_GUIDE.md

# Or open in an editor
code docs/MIGRATION_GUIDE.md  # VS Code
open docs/MIGRATION_GUIDE.md  # macOS
```

### **Step 3: Follow the 6-Phase Migration**

The migration guide walks you through:
1. Creating Google Sheet structure (1 hour)
2. Migrating your concert data (1 hour)
3. Deploying Google Apps Script (30 min)
4. Connecting website to API (30 min)
5. Testing end-to-end (30 min)
6. Going live!

**Total time:** ~3-4 hours for complete setup

---

## ❓ Common Questions

### **Do I have to migrate everything?**

No! You have options:

- **Option A (Full):** Migrate everything to Google Sheets → Fully automated
- **Option B (Hybrid):** Keep Excel + Python, add Google Sheets for bookings only
- **Option C (Current):** Keep static website, no booking system

See [`docs/BOOKINGS_EXCEL_TEMPLATE.md`](docs/BOOKINGS_EXCEL_TEMPLATE.md) for comparison.

### **What if I already have a Google Apps Script?**

Check `data/` folder for `GoogleAppscript.js`. If you have custom logic, we can merge it.

### **How many concerts do you have?**

Check your current data:
```bash
cat data/lrb_concerts_master_final_updated.json | grep "concert_id" | wc -l
```

If you have < 10 concerts, full migration is quick (~2 hours).

### **Can I test without affecting production?**

Yes! Create a test Google Sheet first, deploy the script, test thoroughly, then create production version.

---

## 🆘 Need Help?

1. **Setup Issues:** See [`docs/MIGRATION_GUIDE.md`](docs/MIGRATION_GUIDE.md) → Troubleshooting section
2. **API Issues:** See [`google_apps_script/README.md`](google_apps_script/README.md) → Troubleshooting
3. **Student Seats:** See [`docs/STUDENT_SEATS_UPDATE.md`](docs/STUDENT_SEATS_UPDATE.md)
4. **General Questions:** Open an issue on GitHub

---

## 📅 Timeline

**Already Done (Previous Work):**
- ✅ Website design and structure
- ✅ CSS refactoring and modularization
- ✅ Concert display logic
- ✅ Booking form UI

**Ready to Deploy:**
- ✅ Complete Google Sheets structure (8 tables)
- ✅ Full Google Apps Script backend
- ✅ Master attendees tracking system
- ✅ Student seat allocation system
- ✅ Comprehensive documentation

**Next Steps (Your Choice):**
- ⏭️ Create Google Sheet (1 hour)
- ⏭️ Migrate concert data (1 hour)
- ⏭️ Deploy backend (30 min)
- ⏭️ Connect website (30 min)
- ⏭️ Test and launch!

---

## 🎯 What You Get After Migration

**Before (Manual):**
- Manual Excel updates
- Run Python script
- Copy JSON to website
- No booking management
- ~15-30 min per concert update

**After (Automated):**
- Add concert in Google Sheet → Website auto-updates
- Booking form → Saves automatically
- Master attendees tracking
- Payment screenshots → Auto-upload
- Real-time seat availability
- ~2 min per concert update

**Time Saved:** 90%+ reduction in manual work!

---

## 🏁 Ready?

**Start here:** [`docs/MIGRATION_GUIDE.md`](docs/MIGRATION_GUIDE.md)

Or if you just want to explore, your website is already at `index.html`!

---

**Built with ❤️ for classical music lovers**

*Last updated: November 6, 2025*
