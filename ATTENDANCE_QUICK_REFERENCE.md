# Quick Reference: Attendance System

## What Was Built

A complete attendance system with:
- ✅ Admin settings panel to configure work hours, check-in/out windows, grace periods
- ✅ Check-in API that calculates late status automatically
- ✅ Check-out API that calculates work hours and overtime
- ✅ Dashboard table showing all attendance records with formatted status
- ✅ Settings displayed on dashboard (check-in/out windows)

## File Changes Made

### New Files Created
1. **`src/app/api/admin/attendance/list/route.ts`** - Fetch attendance records for dashboard

### Files Updated
1. **`src/app/api/admin/attendance/checkin/route.ts`** - Enhanced with proper logic
2. **`src/app/api/admin/attendance/checkout/route.ts`** - Enhanced with proper logic
3. **`src/app/admin/dashboard/page.tsx`** - Added attendance table and settings display

### Files Used (No Changes)
- `src/lib/database/schema.ts` - Already has attendanceSettings table
- `src/app/api/admin/settings/route.ts` - Already saves/fetches settings
- `src/app/api/admin/settings/attendance/route.ts` - Already manages attendance settings

## How to Test

### 1. Save Attendance Settings
```
PUT /api/admin/settings
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

### 2. Employee Checks In
```
POST /api/admin/attendance/checkin
{
  "timestamp": "2025-11-15T09:15:00Z"
}
```

Response will show:
- Status: "present" (on-time) or "late" (with minutes)
- lateMinutes: 0 or number of minutes late

### 3. Employee Checks Out
```
POST /api/admin/attendance/checkout
{
  "timestamp": "2025-11-15T17:45:00Z"
}
```

Response will show:
- workHours: 8.5 (calculated)
- Status: "present" or "half_day" 
- overtimeMinutes: 30 (if worked over required hours)

### 4. View Dashboard
Go to `/admin/dashboard` and scroll to "Attendance Records" section
- Table shows all records with formatted status
- Shows check-in/out window settings

## Key Logic Points

### Check-In Status Calculation
```
If checkInTime > (checkInStart + gracePeriod)
  → Status = "late", lateMinutes = difference
Else
  → Status = "present", lateMinutes = 0
```

### Check-Out Status Calculation
```
If checkOutTime < checkOutEnd
  → Status = "half_day", earlyCheckout = true
Else If workHours > requiredWorkHours
  → Status = "present", overtimeMinutes = calculated
Else
  → Status = "present", overtimeMinutes = 0
```

### Status Display Format
```
"Late by 15 min"     → If late
"Overtime 42 min"    → If worked more
"Early by 30 min"    → If early checkout
"On Time"            → If present, no issues
"Absent"             → If not checked in
```

## Database Queries Used

### Fetch Settings
```sql
SELECT * FROM attendance_settings LIMIT 1;
```

### Get Today's Attendance
```sql
SELECT * FROM attendance 
WHERE employee_id = ? AND date = TODAY
LIMIT 1;
```

### Get All Records for Dashboard
```sql
SELECT 
  a.*, 
  e.id, 
  p.first_name, p.last_name,
  d.name as department_name
FROM attendance a
LEFT JOIN employees e ON a.employee_id = e.id
LEFT JOIN user_profiles p ON e.user_id = p.user_id
LEFT JOIN departments d ON e.department_id = d.id
ORDER BY a.date DESC
LIMIT 20;
```

## Common Issues & Fixes

### Issue: Check-in/checkout fails with "Employee record not found"
**Cause:** Token doesn't have a corresponding employee
**Fix:** Ensure user has an employee profile created

### Issue: Settings not saving
**Cause:** updatedBy references non-existent user
**Fix:** Code now uses `null` for updatedBy if user not found

### Issue: Wrong work hours calculated
**Cause:** Timestamp parsing issue
**Fix:** Ensure timestamps are in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)

### Issue: Dashboard table empty
**Cause:** Records not being fetched
**Fix:** Check browser console for fetch errors; verify auth token is valid

## Environment Variables Needed

None new - uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `NODE_ENV` - For dev fallback cookie support

## Performance Considerations

- Dashboard fetches 20 records by default (pagination supported)
- Add date filter to reduce data: `?date=2025-11-15`
- Indexes recommended on: attendance(employee_id, date), attendance(date)

## Future Enhancements

- [ ] Bulk attendance import
- [ ] Auto checkout when day ends
- [ ] Attendance report generation
- [ ] Email notifications for late arrivals
- [ ] Mobile app integration
- [ ] Biometric integration
- [ ] Geolocation verification
- [ ] Leave adjustment for partial days
