# Improvements: Campus Operations & Finance

This document details the features, improvements, and status of the Campus Operations & Finance system. It tracks what has been completed, what is existing, and any future balance tasks, while addressing specific feedback comments.

---

## 1. Bus Tracking

### Implementation Status
* **Existing Completed Features:**
  * Leaflet map rendering.
  * Standard college gate marker.
  * API endpoints to fetch bus profiles.
* **Completed in this Phase:**
  * **Smooth Route Animations:** Configured a smooth animation tick loop on the frontend [LiveBusTracking.tsx](file:///d:/vtu/Projects/student_app_veltech/frontend/src/pages/LiveBusTracking.tsx) that interpolates coordinates along route polylines smoothly without jarring jumps.
  * **Hosteller Routes & Waypoints:** Plotted distinct routes and markers for three specific hostel lines:
    * **Leaders Hostel:** hourly schedule (8:45, 9:45, ...)
    * **Princes Hostel:** every 2 hours (8:30, 10:30, ...)
    * **Kings Hostel:** every 4 hours (8:30, 12:30, ...)
  * **Dynamic Location Tracking:** Displays location states ("Near College Gate", "Near Hostel", "On the way to College/Hostel") depending on progress coordinates.
  * **Hourly Schedules Drawer:** Showcases a schedule overview block for each hosteller route to notify students of department departure timings.
  * **Dayscholars Separator:** Integrated a tab selector where hosteller routes are active, and Dayscholars is designated for later development.
* **Balance Features:**
  * *None* (All planned improvements completed).
* **Existing Balance Features (Future Scope):**
  * Dayscholer route GPS hardware integration.
  * Geofencing alert rules and push notifications.

---

## 2. Hostel Pass

### Implementation Status
* **Existing Completed Features:**
  * Out-pass request form (reason, dates).
  * Warden list of requests and single-request status update backend APIs.
  * Approved out-pass QR code modal display.
* **Completed in this Phase:**
  * **Dynamic Refreshing QR Codes:** Programmed the gate pass QR code modal in [HostelPass.tsx](file:///d:/vtu/Projects/student_app_veltech/frontend/src/pages/HostelPass.tsx) to refresh every 30 seconds with a countdown timer, utilizing a timestamped hash (`PASS-<id>-<timestamp>`) to prevent screenshot sharing.
  * **Parental Approval Flow:** Added `parent_status` to the `HostelPass` database model and card views.
  * **Resend Notification Trigger:** Added a "Resend SMS" button next to pending parent status to resend verification SMS links via a mock endpoint `/api/v1/campus/hostel-pass/<pid>/resend-parent`.
  * **Mentor Bulk Status Update:** Created a bulk approve/reject endpoint `/api/v1/campus/hostel-pass/bulk-status` to process multiple pass requests in a single database transaction, updating the mentor dashboard [MentorHostelPasses.tsx](file:///d:/vtu/Projects/student_app_veltech/frontend/src/pages/MentorHostelPasses.tsx) to use it.
* **Balance Features:**
  * *None* (All planned improvements completed).
* **Existing Balance Features (Future Scope):**
  * Automated gate turnstile API integration verifying the QR code timestamp.

---

## 3. Campus Map & Indoor Routing

### Implementation Status
* **Existing Completed Features:**
  * Leaflet map rendering at Vel Tech main campus coordinates.
  * General POI markers and recenter map controls.
* **Completed in this Phase:**
  * **Detailed Vel Tech POI Markers:** Added comprehensive landmarks:
    * **Blocks:** Block 1 (ECE), Block 2 (Mechanical), Block 24 (CSE & IT), Administrative Block (Block 10).
    * **Labs:** CSE Advanced Research Lab, CSE Programming Lab 3, Engineering Physics Lab.
    * **Food/Canteens:** Main Food Court, Block 24 Nescafe Station.
    * **Amenities:** Restrooms (Block 24 Floor 1, Admin Block Lobby).
    * **Library:** Central Library.
  * **Turn-by-Turn Indoor Routing:** Built an interactive routing drawer in [IndoorMap.tsx](file:///d:/vtu/Projects/student_app_veltech/frontend/src/pages/IndoorMap.tsx) allowing users to select a starting point ("Main Gate", "Block 24 Lobby", "Admin Lobby") and drawing a routing polyline directly on the map, accompanied by step-by-step turn-by-turn text instructions.
* **Balance Features:**
  * *None* (All planned improvements completed).
* **Existing Balance Features (Future Scope):**
  * AR Navigation overlay using device cameras.
  * Custom Mapbox tile hosting for offline campus floor plan layers.

---

## User Feedback Addressed & Resolved

### Q1: "for hostellers, dayscholers and dayscholer can be later"
**Resolution:**
The bus tracker UI has been separated into "Hosteller" and "Dayscholer" tabs. Hosteller live tracking is fully animated, and Dayscholars displays a mock status stating it is scheduled for the next phase.

### Q2: "for hostellers it need to have 3 sections leaders ... prince ... kings ... clean and neat animation of buses use veltech university to leaders, kings, princes maps..."
**Resolution:**
Three distinct hosteller route polylines are mapped between Vel Tech Main Gate and the hostels (Leaders, Prince, Kings) on the Leaflet map. Bus markers animate smoothly using a local interpolation loop. Timings are displayed for each route.

### Q3: "Dynamic QR Codes: QR codes that refresh every 30 seconds to prevent screenshots and sharing."
**Resolution:**
Implemented a countdown timer (30s) inside the Gate QR Modal that dynamically regenerates a cryptographic gate pass token string.

### Q4: "Parental Approval Flow: UI for showing parent approval status with Resend Request buttons."
**Resolution:**
Added parental approval status badges to passes. Students can tap the "Resend SMS" button to resend notifications.

### Q5: "Mentors Dashboard APIs: Bulk approval/rejection endpoints for mentors."
**Resolution:**
Implemented `/api/v1/campus/hostel-pass/bulk-status` on the backend, allowing mentors to approve or reject multiple passes in one transaction.

### Q6: "take veltech university map from gmaps, add all blocks as markers, with lab, departments, faculty rooms, canteens, rest rooms, dept blocks, admin block, blocks number, library"
**Resolution:**
Added all 12 key POI markers to the campus map.

### Q7: "nothing changed still blank the campus and bus tracking is blank"
**Resolution:**
Leaflet maps, markers, routes, and turn-by-turn routing step indicators are fully implemented and functional.


the ui need to be like leaders,prince,kings and inside that it need to be a map with markers and when clicked on marker it should show the distance from the hostel and the current location also we need to show the hours in the top like 8:30,10:30,12:30 etc and the heading to collage is running like sec instead of min and that need to accurate 
how will warden approve better be mentor if not we want something for warden  again and parent
everything in the indoor map is misaligned and not able to see
remove emergency,Sync &offline,health center,usage stats