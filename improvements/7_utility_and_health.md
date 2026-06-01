# Improvements: Utility & Health





## 5. Offline Mode & Sync Status
### Frontend Improvements
- **Granular Control:** just the time table,attdenace and academic calender should be available offline
- **Background Sync Indicator:** A subtle spinning icon indicating when background syncing is occurring.

### Backend Improvements
- **Conflict Resolution:** Implement robust CRDTs (Conflict-free Replicated Data Types) or Last-Write-Wins logic for when a device comes back online after making local changes.
- **Delta Payloads:** Only send the data that has changed since the last sync, rather than the entire dataset.
 moves these things to the profiles section and remove in the campus section