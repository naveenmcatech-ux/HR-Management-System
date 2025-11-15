# Complete Attendance System Implementation

## Overview

A fully functional attendance system that dynamically calculates work hours, late/early status, and overtime based on configurable settings saved by admin in the System Settings panel.

---

## Architecture & Components

### 1. **Attendance Settings (Database Table)**

**File:** `src/lib/database/schema.ts` - `attendanceSettings` table

**Stored Fields:**
- `workHours` (decimal) - Standard work hours per day (default: 8.0)
- `overtimeRate` (decimal) - Overtime multiplier (default: 1.5)
- `gracePeriod` (integer) - Grace period in minutes (default: 15)
- `autoCheckout` (boolean) - Auto checkout feature (default: true)
- `checkInStart` (time) - Check-in window start (default: 08:00)
- `checkInEnd` (time) - Check-in window end (default: 10:00)
- `checkOutStart` (time) - Check-out window start (default: 17:00)
- `checkOutEnd` (time) - Check-out window end (default: 19:00)
- `updatedBy` (uuid) - Who last updated these settings
- `updatedAt` (timestamp) - When settings were last updated

**Key Point:** Single record (replaces JSON blob in system_settings)

---

### 2. **Settings API Routes**

#### Save/Update Attendance Settings
**Endpoint:** `PUT /api/admin/settings`

**Request Body:**
```json
{
  "attendance": {
    "workHours": 8,
    "overtimeRate": 1.5,
    "gracePeriod": 15,
    "autoCheckout": true,
    "checkInStart": "08:00",
    "checkInEnd": "10:00",
    "checkOutStart": "17:00",
    "checkOutEnd": "19:00"
  }
}
```

**Validation:**
- ✅ Validates all required fields present
- ✅ Checks updatedBy user exists in database
- ✅ Uses null for updatedBy if user not found (dev fallback support)

**Response:**
```json
{
  "success": true,
  "updatedCategories": ["attendance"],
  "message": "System settings updated successfully"
}
```

#### Fetch Attendance Settings
**Endpoint:** `GET /api/admin/settings/attendance`

**Response:**
```json
{
  "settings": {
    "id": "uuid",
    "workHours": "8.0",
    "overtimeRate": "1.5",
    "gracePeriod": 15,
    "autoCheckout": true,
    "checkInStart": "08:00",
    "checkInEnd": "10:00",
    "checkOutStart": "17:00",
    "checkOutEnd": "19:00",
    "updatedAt": "2025-11-15T10:30:00Z"
  }
}
```

---

### 3. **Check-In API**

**File:** `src/app/api/admin/attendance/checkin/route.ts`

**Endpoint:** `POST /api/admin/attendance/checkin`

**Request Body:**
```json
{
  "timestamp": "2025-11-15T09:15:00Z"
}
```

**Logic:**
1. Get employee record from token (supports both `userId` and `id`)
2. Fetch attendance settings
3. Check for existing check-in today (prevent duplicate)
4. Parse `checkInStart` from settings (e.g., "08:00")
5. Calculate grace period threshold: `checkInStart + gracePeriod`
6. Compare actual check-in time:
   - ✅ If within window or grace period → **Status: "present"**, `lateMinutes: 0`
   - ⚠️ If after grace period → **Status: "late"**, `lateMinutes: actual - threshold`
7. Create or update attendance record

**Response:**
```json
{
  "success": true,
  "message": "Checked in successfully (On time)",
  "attendance": {
    "id": "uuid",
    "employeeId": "uuid",
    "date": "2025-11-15",
    "checkIn": "2025-11-15T09:15:00Z",
    "status": "present",
    "lateMinutes": 0
  }
}
```

---

### 4. **Check-Out API**

**File:** `src/app/api/admin/attendance/checkout/route.ts`

**Endpoint:** `POST /api/admin/attendance/checkout`

**Request Body:**
```json
{
  "timestamp": "2025-11-15T17:45:00Z"
}
```

**Logic:**
1. Get employee and attendance record for today
2. Fetch attendance settings
3. Calculate work hours: `(checkOutTime - checkInTime) / (1000 * 60 * 60)`
4. Compare against `checkOutEnd` from settings:
   - ✅ If checked out after end time → Keep "present", calculate `overtimeMinutes`
   - ⚠️ If checked out before end time → **Status: "half_day"**, `earlyCheckout: true`
5. Update record with:
   - `checkOut` timestamp
   - `workHours` (calculated)
   - `overtimeMinutes` (if applicable)
   - `earlyCheckout` flag
   - `status` (present/half_day)

**Response:**
```json
{
  "success": true,
  "message": "Checked out successfully. Worked 8.7 hours (Overtime 42 minutes)",
  "attendance": {
    "id": "uuid",
    "date": "2025-11-15",
    "checkIn": "2025-11-15T09:15:00Z",
    "checkOut": "2025-11-15T17:55:00Z",
    "workHours": "8.67",
    "status": "present",
    "lateMinutes": 0,
    "earlyCheckout": false,
    "overtimeMinutes": 42
  }
}
```

---

### 5. **Attendance List API**

**File:** `src/app/api/admin/attendance/list/route.ts`

**Endpoint:** `GET /api/admin/attendance/list?limit=20&offset=0&date=2025-11-15`

**Query Parameters:**
- `limit` (optional, default: 100) - Records per page
- `offset` (optional, default: 0) - Pagination offset
- `date` (optional) - Filter by specific date (YYYY-MM-DD format)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "employeeName": "John Doe",
      "departmentName": "Engineering",
      "date": "2025-11-15",
      "checkIn": "2025-11-15T09:15:00Z",
      "checkOut": "2025-11-15T17:55:00Z",
      "workHours": "8.67",
      "status": "Late by 15 min",
      "lateMinutes": 15,
      "earlyCheckout": false,
      "overtimeMinutes": 42
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Status Formatting:**
- `Late by X min` → Employee checked in after grace period
- `Early by X min` → Employee checked out before scheduled time
- `On Time` → Normal check-in, no late minutes
- `Overtime X min` → Worked beyond required hours
- `Absent` → Not checked in
- `Not Checked In` → Record exists but no check-in

---

### 6. **Attendance Database Table**

**File:** `src/lib/database/schema.ts` - `attendance` table

**Stored Fields:**
- `id` (uuid) - Primary key
- `employeeId` (uuid) - Reference to employee
- `date` (date) - Attendance date
- `checkIn` (timestamp) - Check-in time (full timestamp)
- `checkOut` (timestamp) - Check-out time (full timestamp)
- `status` (varchar) - "present", "late", "half_day", "absent", "not_checked_in"
- `workHours` (decimal) - Calculated work hours
- `lateMinutes` (integer) - Minutes late after grace period
- `earlyCheckout` (boolean) - Checked out early
- `overtimeMinutes` (integer) - Minutes worked beyond required hours
- `notes` (text) - Admin notes
- `isManualEntry` (boolean) - Whether admin manually created this record

---

## Dashboard Integration

**File:** `src/app/admin/dashboard/page.tsx`

### Features:

#### 1. Display Attendance Settings Window
```
Check-in: 08:00 - 10:00 | Check-out: 17:00 - 19:00
```
Displayed at top of Attendance Records table so users know working hours

#### 2. Attendance Records Table
Columns:
- Employee Name
- Department
- Date
- Check In (time only)
- Check Out (time only)
- Work Hours (formatted to 1 decimal place)
- Status (color-coded badge)

**Status Color Coding:**
- 🔴 Red: Late by X min
- 🟡 Yellow: Early by X min
- 🔵 Blue: Overtime X min
- 🟢 Green: On Time
- ⚪ Gray: Absent / Not Checked In

#### 3. Fetch & Display Logic
```typescript
// In component useEffect:
fetchAttendanceSettings() // Gets current settings
fetchAttendanceRecords()   // Gets last 20 records

// Settings auto-refresh on time range change
```

---

## Data Flow Diagram

```
Admin Panel (System Settings)
    ↓
PUT /api/admin/settings
    ↓
Save to attendanceSettings table
    ↓
Dashboard fetches settings on load
    ↓
GET /api/admin/settings/attendance
    ↓
Display Check-in/Check-out window


Employee Action (Check-in)
    ↓
POST /api/admin/attendance/checkin
    ↓
Compare time vs checkInStart + gracePeriod
    ↓
Store checkIn, status, lateMinutes
    ↓
Update attendance table


Employee Action (Check-out)
    ↓
POST /api/admin/attendance/checkout
    ↓
Calculate workHours = checkOut - checkIn
    ↓
Compare checkOut vs checkOutEnd
    ↓
Store checkOut, workHours, status, overtimeMinutes
    ↓
Update attendance table


Dashboard Display
    ↓
GET /api/admin/attendance/list
    ↓
Format status with minutes (Late by 15 min)
    ↓
Display in table with color-coded badges
```

---

## Calculation Examples

### Example 1: Late Check-in
**Settings:** checkInStart: "08:00", gracePeriod: 15 min
**Employee checks in at:** 08:20

**Calculation:**
```
checkInStart (minutes) = 8 * 60 + 0 = 480
lateThreshold = 480 + 15 = 495 (08:15)
actualCheckIn (minutes) = 8 * 60 + 20 = 500
lateMinutes = 500 - 495 = 5

Result: Status = "late", lateMinutes = 5
Dashboard shows: "Late by 5 min"
```

### Example 2: Overtime Work
**Settings:** workHours: 8, checkOutEnd: "17:00"
**Employee:** Checks in at 08:00, checks out at 18:00

**Calculation:**
```
workMilliseconds = (18:00 - 08:00) = 10 hours
workHours = 10.0
requiredWorkHours = 8.0

checkOutTime (18:00) > checkOutEnd (17:00) → Not early checkout
overtimeMinutes = (10.0 - 8.0) * 60 = 120 minutes

Result: Status = "present", workHours = 10.0, overtimeMinutes = 120
Dashboard shows: "Overtime 120 min"
```

### Example 3: Early Checkout
**Settings:** workHours: 8, checkOutEnd: "17:00"
**Employee:** Checks in at 09:00, checks out at 16:30

**Calculation:**
```
workMilliseconds = (16:30 - 09:00) = 7.5 hours
workHours = 7.5
requiredWorkHours = 8.0

checkOutTime (16:30) < checkOutEnd (17:00) → Early checkout
earlyCheckout = true
status = "half_day"

Result: Status = "half_day", workHours = 7.5, earlyCheckout = true
Dashboard shows: "Early by 30 min"
```

---

## Key Features Implemented

✅ **Settings save properly in database**
- Validated attendance settings stored in dedicated table
- Supports update/insert with user tracking

✅ **Dynamic check-in validation**
- Employees can check in anytime
- System calculates on-time vs late based on settings
- Grace period applied automatically

✅ **Dynamic work hours calculation**
- Calculated on check-out
- Compared against required hours from settings
- Overtime detected and stored

✅ **Status display with detail**
- Dashboard shows formatted status strings
- "Late by X min", "Overtime X min", "On Time", etc.
- Color-coded for quick visual scanning

✅ **Dashboard integration**
- Fetches settings on load
- Displays check-in/check-out window
- Shows last 20 attendance records
- Pagination support
- Responsive table design

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/settings` | PUT | Save/update all system settings including attendance |
| `/api/admin/settings/attendance` | GET | Fetch current attendance settings |
| `/api/admin/attendance/checkin` | POST | Record check-in with status calculation |
| `/api/admin/attendance/checkout` | POST | Record check-out with work hours & overtime |
| `/api/admin/attendance/list` | GET | Fetch formatted attendance records for dashboard |

---

## Testing Checklist

- [ ] Admin saves attendance settings in System Settings
- [ ] Dashboard displays correct check-in/check-out window after refresh
- [ ] Employee can check-in before, during, and after check-in window
- [ ] Late calculation is correct (includes grace period)
- [ ] Employee can check-out before, during, and after checkout window
- [ ] Work hours calculated correctly (decimal places)
- [ ] Overtime minutes calculated correctly
- [ ] Early checkout flagged correctly
- [ ] Dashboard table shows all records with correct status formatting
- [ ] Status colors display correctly (red for late, blue for OT, etc.)
- [ ] Pagination works with large datasets
- [ ] Date filtering works
- [ ] Admin fallback (cookie-based) works in development

---

## Notes

- All timestamps stored in full ISO 8601 format (includes date AND time)
- Settings are fetched fresh from database on every request
- Support for both `userId` and `id` fields in JWT token for compatibility
- Dev admin fallback (cookie) supported for non-production environments
- Database transactions used for data consistency
- Proper error handling with detailed messages
