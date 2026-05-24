# Improvements: Utility & Health
compleetly remove polls&surveys,buy&sell

## 2. Emergency Button
### Frontend Improvements
- **Countdown Cancel:** A 3-second visual countdown allowing the user to cancel accidental presses.
- **Silent Mode:** An option to trigger the alert silently in sensitive situations.

### Backend Improvements
- **Twilio Integration:** Trigger automated SMS and voice calls to emergency contacts and campus security.
- **Location Tracking:** Continuous WebSocket location updates for 15 minutes after activation.


## 4. Dark Mode
### Frontend Improvements
- **System Sync:** Listen to OS-level theme changes (`prefers-color-scheme`) and auto-switch.
- **Theme Customization:** Allow users to choose accent colors (e.g., Blue, Purple, Green) alongside Dark/Light.
 add this button in the profile section
### Backend Improvements
- **Preferences Sync:** Save the theme preference in the user's database profile so it persists across devices.

## 5. Offline Mode & Sync Status
### Frontend Improvements
- **Granular Control:** Allow users to choose what data to cache (e.g., "Cache Timetable and Syllabus, but not News Feed").
- **Background Sync Indicator:** A subtle spinning icon indicating when background syncing is occurring.

### Backend Improvements
- **Conflict Resolution:** Implement robust CRDTs (Conflict-free Replicated Data Types) or Last-Write-Wins logic for when a device comes back online after making local changes.
- **Delta Payloads:** Only send the data that has changed since the last sync, rather than the entire dataset.
 moves these things to the profiles section and remove in the campus section