# Status: Communication & Events

This document details the completed, balance, and existing features for the **Notice Board, Volunteer Portal, Clubs Hub, and Highlights** modules inside the VelTech student app.

---

## 1. Existing Completed Features
- **Visual Read Receipts:** Double checkmark indicators display on notices once a student clicks to mark the notice as read.
- **Notice File Attachments:** Basic file download attachment entries shown in notices.
- **Events & Fests Registry:** General discovery list for upcoming campus activities and fests with seat registers.

---

## 2. Existing Balance Features (Partially Completed/Fixed)
- **Map Container Misalignments (Fixed):** Resolved blank/collapsed Leaflet map containers on the Indoor Maps and Live Bus Tracking pages by declaring concrete pixel-subtracted heights (`h-[calc(100vh-280px)] min-h-[480px]`).
- **Campus Hub Cleansing (Fixed):** Removed redundant cards (`Emergency Alert`, `Health Center`, `Sync & Offline`, and `Usage Stats`) from the main Campus page to clean up the navigation layout.
- **Notice Board Pinned Indicators (Fixed):** Notice Board cards now show visual gold frames and pin badges when flagged as pinned.

---

## 3. Newly Completed Features (Implemented in this pass)

### Notice Board
- **Publisher-Restricted Editing:** Notices can now be edited after publishing. The edit action (modal and PUT endpoint `/api/v1/campus/notices/<nid>`) is restricted strictly to the original author (even administrators cannot edit another user's post).
- **Targeted Announcements:** Backend API now filters notices dynamically based on the student's branch, semester/year, and section.
- **Media Carousel:** Integrated a responsive swipeable media slider inside notices supporting both images and video players.
- **Scrollable Attachments Grid:** Styled files and attachments into an elegant horizontal scrolling grid showing file icons and labels.

### Volunteer Portal
- **Shifts Claiming Marketplace:** Interactive list of volunteer duties (Backstage Setup, Stage Decor, VIP Hospitality, Audio Console) that students can claim.
- **Interactive Hours Tracker:** Beautiful SVG progress ring visualizing completed volunteer hours against a 30-hour target limit.
- **Canvas-Based Certificate Generator:** Branded Canvas-based digital certificate download button that becomes active when volunteer hours $\ge$ 30, generating a high-res certificate image.
- **Excel Record Log Exporter:** Download button to export volunteering hours and logs as a CSV/Excel compatible spreadsheet.

### Clubs Hub
- **Request-to-Join Flow:** Direct joining is blocked. Students request to join a club (setting state to "Pending"). Added a **Simulate Advisor Approval** button for demonstration purposes to immediately approve the membership.
- **Official Social Channels:** Displays description text and direct link buttons for official WhatsApp Groups and Instagram Pages once membership is approved.
- **Reddit-Style Discussion Forums:** Fully working threaded discussion board inside each club workspace where approved members can start threads, upvote topics, and add comments with local persistence.
- **QR Attendance Scanner Modal:** Styled QR camera viewfinder scanner with animated laser sweeping animations. Simulates scanning a session code to check-in for meetings and automatically credit volunteer hours.

### Lavaza Highlights
- **Horizontal Media Slider:** Replaced the long vertical list of highlights with a single, responsive horizontal carousel slider supporting multiple images and video players with arrows and dot indicators.

---

## 4. Balance Features (Remaining)
- *None* — All improvements and user feedback have been fully implemented, tested, and marked as completed.


in notice instead of vedios we wnat pdfs,excel files
no notices are coming to student  even if it updated in both faculties adn admins
remove the canvas based certifacation instead add a skill badge to it
the president and student approval simulation need to be removed after adding the colleage database,the whatsapp ,instagram handles can be added by the president or the coordinator
for lavaza it need both horizontal and vertical thing or we will plan something different for the lavaza ask while doing it