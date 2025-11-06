# How to Get the Encoding Fixes

## Step 1: Pull the Latest Changes

Open your terminal and run:

```bash
# Navigate to your project folder
cd /path/to/living-room-baithaks

# Pull the latest changes
git pull origin claude/baithak-shows-upc-011CUr6bp8b7qqz4tkdrmzzp
```

**Expected output:**
```
Updating 99ffecc..334bab7
Fast-forward
 ENCODING_FIX.md                                  | 191 ++++++++
 src/living_room_website/scripts/main.js          |  12 +-
 1 file changed, 197 insertions(+), 6 deletions(-)
```

---

## Step 2: Verify You Have the Latest Files

Check the commit log:

```bash
git log --oneline -3
```

**You should see:**
```
334bab7 Add character encoding fix verification guide
43a246e Fix character encoding issues in main.js
99ffecc Refactor website architecture and implement Google Apps Script backend
```

If you see these 3 commits, you have the latest code! ✅

---

## Step 3: Check the Fixed Files Directly

Run this command to see the proper symbols in main.js:

```bash
grep -n "—" src/living_room_website/scripts/main.js
```

**You should see:**
```
37:    return `${concert.concert_time} — Baithak Begins`;
42:      ${concert.meal_time} — ${mealType} followed by Baithak<br/>
43:      ${concert.concert_time} — Baithak Begins
48:    ${concert.concert_time} — Baithak<br/>
49:    ${concert.meal_time} — ${mealType}
```

Notice the **proper em dash (—)** not the corrupted `â€"`.

Check for rupee symbol:

```bash
grep -n "₹" src/living_room_website/index.html | head -3
```

**You should see:**
```
140:    <div class="seat-price-minimal">₹<span id="generalPriceDisplay">1000</span> each</div>
152:    <div class="seat-price-minimal">₹<span id="studentPriceDisplay">500</span> each</div>
176:    <div class="total-amount">₹<span id="totalAmount">0</span></div>
```

Notice the **proper rupee symbol (₹)** not `â‚¹`.

---

## Step 4: Open in Browser and Test

1. **Open the file:**
   ```
   src/living_room_website/index.html
   ```

2. **Clear browser cache** (IMPORTANT!):
   - Chrome/Edge: Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"

   **OR** just do a hard refresh: `Ctrl + F5`

3. **Check these specific spots:**

   ✅ **Hero section - Event time:**
   - Should display: `10:30 — Baithak Begins`
   - NOT: `10:30 â€" Baithak Begins`

   ✅ **Hero section - Pricing:**
   - Should display: `₹1000 (General) • ₹500 (Students)`
   - NOT: `â‚¹1000 (General) &bull; â‚¹500 (Students)`

   ✅ **Booking Flow - Step 2:**
   - Should display: `₹1000 each` and `₹500 each`
   - NOT: `â‚¹1000 each`

   ✅ **Past Events section:**
   - Links should show: `View Gallery/Recording →`
   - NOT: `View Gallery/Recording â†'`

---

## Troubleshooting

### "I pulled but still see â‚¹"

**Solution:** Clear browser cache aggressively:
1. Close all browser tabs
2. Clear cache completely (`Ctrl + Shift + Delete`)
3. Restart browser
4. Open `index.html` fresh

### "Git pull says 'Already up to date'"

Check which branch you're on:
```bash
git branch
```

Should show:
```
* claude/baithak-shows-upc-011CUr6bp8b7qqz4tkdrmzzp
```

If not on this branch:
```bash
git checkout claude/baithak-shows-upc-011CUr6bp8b7qqz4tkdrmzzp
git pull origin claude/baithak-shows-upc-011CUr6bp8b7qqz4tkdrmzzp
```

### "I see ▼ in FAQ section"

There is no FAQ section with ▼ in the new `index.html`. You might be looking at:
- Old cached version in browser
- Archived file (`archive/index_now.html`) instead of new `index.html`

Make sure you're opening: `src/living_room_website/index.html` (NOT the archived versions)

### "I see &bull; instead of •"

This is an HTML entity. The browser should render it as a bullet point (•).

If you see the literal text `&bull;`:
- Clear browser cache
- Check you're not viewing page source (view rendered page instead)

---

## Quick Verification Script

Save this as `check_encoding.sh` and run it:

```bash
#!/bin/bash
echo "Checking encoding in files..."
echo ""

echo "1. Checking for proper em dash in main.js:"
grep "—" src/living_room_website/scripts/main.js | wc -l
echo "   (Should be 6 lines)"
echo ""

echo "2. Checking for rupee symbol in index.html:"
grep "₹" src/living_room_website/index.html | wc -l
echo "   (Should be 5 lines)"
echo ""

echo "3. Checking for corrupted characters:"
grep "â€\|â‚¹\|â†'" src/living_room_website/scripts/main.js | wc -l
echo "   (Should be 0 lines)"
echo ""

echo "If all numbers match, your files are correct! ✅"
```

Run it:
```bash
chmod +x check_encoding.sh
./check_encoding.sh
```

---

## What Each Symbol Should Look Like

| Symbol | Name | What You Should See | What You Should NOT See |
|--------|------|---------------------|-------------------------|
| — | Em dash | `10:30 — Baithak` | `10:30 â€" Baithak` |
| ₹ | Rupee | `₹1000` | `â‚¹1000` |
| → | Arrow | `View →` | `View â†'` |
| • | Bullet | `• Item` | `&bull; Item` or `• Item` |
| ✓ | Check | `✓ Done` | `âœ Done` |

---

## After Fixing

Once you've pulled and cleared cache, all special characters should display perfectly:

- ✅ Em dashes in time displays
- ✅ Rupee symbols in pricing
- ✅ Bullets in lists (as actual bullets, not &bull;)
- ✅ Checkmarks in confirmations
- ✅ Arrows in navigation

**Your website will look professional and clean!** 🎉

---

## Still Having Issues?

If after following all these steps you still see encoding issues:

1. **Take a screenshot** of what you're seeing
2. **Check which file** you're viewing (`index.html` or archived version?)
3. **Run the verification script** above
4. **Share the output** of:
   ```bash
   git log --oneline -3
   file -bi src/living_room_website/index.html
   file -bi src/living_room_website/scripts/main.js
   ```

This will help diagnose the exact issue.
