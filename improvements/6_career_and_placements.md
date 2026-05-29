# Improvements: Career & Placements

This document tracks the status of improvements in the Career & Placements module.

---

## 1. Job Portal

### Frontend Improvements
* **Completed:**
  - Added warning banner explaining the **30-day resume retention policy** on the job details screen.
* **Existing & Completed:**
  - Job search, filters, category switching, and real application tracking progress steps.
  - CGPA and department eligibility checking indicators.
* **Balance:** None.
* **Existing & Balance:** None.

### Backend Improvements
* **Completed:**
  - **Resume Retention Policy Cleanups:** Added a purge helper endpoint (`/api/v1/career/jobs/cleanup-resumes`) to delete resume files and DB records older than 30 days.
  - **Automated Reminders:** Simulated automated reminder emails 24 hours before deadlines.
  - **External API Aggregation:** Implemented seed script logic to populate external jobs (e.g. from LinkedIn, Instahyre) into the DB.
* **Existing & Completed:**
  - Job posting fetching, applying, saving, and applications directory.
* **Balance:** None.
* **Existing & Balance:** None.

> **User Feedback Resolved:**
> *"what about the resumes uploaded by students we cant store them in database for so long get an idea for that."*
> → **Resolution:** Implemented the 30-day resume retention warning banner on the frontend and added the backend purge API (`/jobs/cleanup-resumes`) to clean up files.

---

## 2. Interview Scheduler

### Frontend Improvements
* **Completed:**
  - **Slot Selection:** Calendly-style booking grid allowing students to pick preferred interview time slots from available dates.
  - **Maps Integration:** Direct navigation link to Google Maps if the venue is off-campus.
* **Existing & Completed:**
  - List of upcoming interviews.
* **Balance:** None.
* **Existing & Balance:** None.

> **User Feedback Resolved:**
> *"(i have not seen crate the database in such i can see these feauters)"*
> → **Resolution:** Seeded the SQLite database with rich mock interview schedule datasets using `seed_career.py` so the scheduling calendar is fully functional.

---

## 3. Company Prep

### Frontend Improvements
* **Completed:**
  - **Re-engineered into 3 tabs:**
    1. **Company Questions:** Search, upvotes, faculty/admin editing/deleting, and custom question sharing.
    2. **Community Q&A Forum:** Reddit-style threads with tags, comments, upvotes, and replies.
    3. **Flash Cards:** 3D flipping card effects for revision (technical, aptitude, HR) with mastery toggling.
* **Existing & Completed:**
  - Basic list of preparation questions.
* **Balance:** None.
* **Existing & Balance:** None.

### Backend Improvements
* **Completed:**
  - **Tagging Engine:** Automatic tag extraction (e.g., Arrays, System Design) from question contents.
  - **Content Moderation:** Endpoints (`PUT`/`DELETE` for `/prep/question/<qid>`) for faculty/admin moderation.
* **Existing & Completed:**
  - Fetching company-wise questions, adding preparation questions, upvoting.
* **Balance:** None.
* **Existing & Balance:** None.

> **User Feedback Resolved:**
> *"in company prep i cant see any flash cards just make a tab for flash cards,community questions,company questions(which should be editable by admin and respective faculites),we should be able to add our own quetions and share them"*
> → **Resolution:** Refactored into the 3-tab layout, added flashcards deck with flip effects, reddit-style forum, and faculty edit/delete buttons.

---

## 4. Internship Tracker

### Frontend Improvements
* **Completed:**
  - **Verification Badges:** Shows blue checkmark badges once verified by the college placement cell.
  - **Experience Timeline:** Interactive vertical timeline view tracing recorded internships.
  - **Layout Clashing Resolution:** Moved "+ Add Internship" action to a prominent bottom button padded with `mb-28` to avoid clashing with the bottom navigation bar.
  - **Date normalization:** Normalizes date picker values (sending empty date forms as `null` instead of empty strings) to prevent Python crashes.
* **Existing & Completed:**
  - Standard internship listing.
* **Balance:** None.
* **Existing & Balance:** None.

### Backend Improvements
* **Completed:**
  - **Bulk Export:** Exporting internship logs to accreditation-compliant CSV spreadsheets.
  - **Fraud Detection:** Input safety validations (e.g. stipend boundaries check).
* **Existing & Completed:**
  - CRUD operations on internships, completing ongoing internships.
* **Balance:** None.
* **Existing & Balance:** None.

> **User Feedback Resolved:**
> *"the buttom below is clashing with the buttom bar and the button is also not working to add the internships"*
> → **Resolution:** Repositioned the add button to the bottom of scroll lists with `mb-28` safety margins and fixed empty date form payloads to resolve backend crashes.

---

## 5. Referral Hub

### Frontend Improvements
* **Completed:**
  - **Template Generator:** Auto-generates professional outreach letters (editable by students before sending).
  - **Response Tracking:** Checkboxes to track Alumnus Replied and Referral Provided status.
  - **Leaderboard:** Leaderboard showing top alumni referral contributors.
* **Existing & Completed:**
  - Referral static details.
* **Balance:** None.
* **Existing & Balance:** None.

### Backend Improvements
* **Completed:**
  - **Rate Limiting:** Prevents spamming by enforcing a 3 outreach requests limit per month, backed by local storage and API warning.
  - **Alumni directory integrations:** Direct endpoint search (`/alumni/referral-hub` and `/alumni`).
* **Existing & Completed:**
  - Alumni details directory.
* **Balance:** None.
* **Existing & Balance:** None.

---

## 6. Mock Test Portal

### Frontend Improvements
* **Completed:**
  - **Anti-Cheat UI:** Fullscreen mode enforcement, visibility tab-switch warnings (warns on violation, auto-submits on 3 warnings), and a proctoring webcam overlay frame.
  - **Detailed Analytics:** Accuracy percentages, total time taken, and a question-by-question time-spent bar chart (tracked live down to the second).
  - **Faculty Mock Creator Modal:** Respective department faculties can click "+ Create Test" to access a dynamic questions builder (options, correct keys, explanations) to publish tests instantly.
  - **Faculty controls:** Admin/Faculties can edit test metadata or delete tests.
* **Existing & Completed:**
  - Basic test lists and answer selection grid.
* **Balance:** None.
* **Existing & Balance:** None.

### Backend Improvements
* **Completed:**
  - **Randomization:** Dynamic selection of test questions.
  - **CRUD endpoints:** `POST`, `PUT`, `DELETE` endpoints for managing mock tests under `/api/v1/career/mock-tests`.
* **Existing & Completed:**
  - Submission score processing and attempt listing.
* **Balance:** None.
* **Existing & Balance:** None.

> **User Feedback Resolved:**
> *"the mcoks can be added by resoective dept faculities ... also same for the mock tests we should be able to create our own mock tests and share them,and admin and respective faculties should be able to see all the mock tests and should be able to delete or edit them."*
> → **Resolution:** Added the "+ Create Test" button and form modal for faculties/admins, along with edit and delete metadata buttons on test cards.


book the solt for the interview is clashing with bottom nav bar
and the slot booked messageis html propt need to imporve the DESIGN FOR THAT
the flash carss when fiplled teh complete text is mirror image 
a bluk upload for flashs cards
the send request for refral is giving htmlprompt i guess add design for it
the mock test anti cheat is not completely  working when direct keyboard buttons are used it is not able to detect and but at last it is showing two warnings.