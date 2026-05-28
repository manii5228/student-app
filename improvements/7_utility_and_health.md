# Improvements: Utility & Health



## 4. Dark Mode
### Frontend Improvements
- **System Sync:** Listen to OS-level theme changes (`prefers-color-scheme`) and auto-switch.
- **Theme Customization:** Allow users to choose accent colors (e.g., Blue, Purple, Green) alongside Dark/Light.
teh themes,colour are just there they are nit changing the if tehy are selected
### Backend Improvements
- **Preferences Sync:** Save the theme preference in the user's database profile so it persists across devices.

## 5. Offline Mode & Sync Status
### Frontend Improvements
- **Granular Control:** just the time table,attdenace and academic calender should be available offline
- **Background Sync Indicator:** A subtle spinning icon indicating when background syncing is occurring.

### Backend Improvements
- **Conflict Resolution:** Implement robust CRDTs (Conflict-free Replicated Data Types) or Last-Write-Wins logic for when a device comes back online after making local changes.
- **Delta Payloads:** Only send the data that has changed since the last sync, rather than the entire dataset.
 moves these things to the profiles section and remove in the campus section