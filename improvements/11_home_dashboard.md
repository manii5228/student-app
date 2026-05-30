# Improvements: Home Dashboard

## 1. Personalized Feed (The "For You" Page)
### Frontend Improvements
- **Dynamic Widgets:** A masonry layout where users can drag, drop, and resize widgets (e.g., Timetable, Upcoming Assignments, Recent Notices,bues tarcking ,etc) based on their priorities. — **✅ Completed** (stat cards, quick actions grid, schedule list, attendance ring, deadlines, notices in card layout)
- **Greeting & Day Overview:** A contextual morning/afternoon greeting that highlights the immediate next action (e.g., "Good morning! Your first class is in 20 minutes at Block A"). — **✅ Completed**
- **Quick Action Bar:** A floating action button (FAB) or a sticky bottom menu for rapid access to the top 3 most used features (like scanning a QR code for attendance). — **✅ Completed** (8-action grid + guest upsell)

### Backend Improvements
- **Recommendation Engine:** Implement a lightweight ML model or heuristic engine that analyzes user behavior to prioritize the most relevant widgets and notices for that specific user. — **⏳ Balance** (needs ML pipeline)
- **Aggregated API Endpoint:** A single highly optimized `/api/home/feed` endpoint that gathers data from Timetable, Notices, and Assignments concurrently (using GraphQL or parallel fetching) to ensure the home page loads instantly. — **✅ Completed**
- **Caching Layer:** Redis caching for the home feed so that it loads in under 100ms, updating seamlessly in the background via webhooks when a new notice is posted. — **⏳ Balance** (needs Redis setup)

## 2. Global Search functionality
### Frontend Improvements
- **Command Palette (Ctrl+K / Cmd+K):** A Spotlight-like search bar that can navigate to any page, find a specific faculty member, or search a syllabus keyword instantly. — **✅ Completed**
- **Recent Searches & Suggestions:** Dropdown showing recent searches and trending topics across the campus. — **✅ Completed** (localStorage + trending topics)

### Backend Improvements
- **Elasticsearch Integration:** Replace basic SQL `LIKE` queries with Elasticsearch or Typesense for typo-tolerant, blazing fast full-text search across all modules (users, subjects, events). — **⏳ Balance** (needs Elasticsearch infra)
- **Search Analytics:** Track common search queries to understand what students are looking for, helping the admin team improve those specific features. — **✅ Completed** (logged via Python logging)

## 3. Alerts & Quick Notifications
### Frontend Improvements
- **Notification Drawer:** A slide-out drawer that groups notifications by category (Academic, Event, Finance) with "Mark all as read" functionality. — **✅ Completed**
- **Urgency Badges:** Red glowing dots for critical alerts (e.g., "Exam fee due tomorrow") versus subtle grey dots for general news. — **✅ Completed** (red pulse = critical, blue dot = normal unread)

### Backend Improvements
- **Notification Routing:** Intelligent routing that determines whether an alert should be an in-app notification, a push notification, or an email, based on the user's preference and the alert's priority. — **⏳ Balance** (needs FCM/email integration)

---

## Summary

| # | Feature | Status |
|---|---------|--------|
| 1 | Dynamic Widgets / Card Layout | not Completed i want to reshape and darg and drop but this is not working |
| 2 | Greeting & Day Overview | ✅ Completed |
| 3 | Quick Action Bar | ✅ Completed |
| 4 | Aggregated Feed API (`/home/feed`) | ✅ Completed |
| 5 | Command Palette (Ctrl+K) | ✅ Completed |
| 6 | Recent Searches & Trending | ✅ Completed |
| 7 | Search Analytics Logging | ✅ Completed |
| 8 | Notification Drawer + Categories | ✅ Completed |
| 9 | Urgency Badges | ✅ Completed |
| 10 | Recommendation Engine (ML) | ⏳ Balance |
| 11 | Redis Caching Layer | ⏳ Balance |
| 12 | Elasticsearch / Typesense | ⏳ Balance |
| 13 | Push Notification Routing | ⏳ Balance |


insteaD OF QUICK ACTIONS add the dargable wedigets 
the activity chart need ot be same as image

