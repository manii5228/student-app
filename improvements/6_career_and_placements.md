# Improvements: Career & Placements

## 1. Job Portal
### Frontend Improvements

### Backend Improvements
- **External API Aggregation:** Pulling public entry-level jobs from platforms like LinkedIn or Instahyre to supplement campus drives.
- **Automated Reminders:** Trigger emails 24 hours before a job application deadline.
what about the resume we cant store them in database for so long get an idea for that.



## 3. Interview Scheduler
### Frontend Improvements
- **Slot Selection:** Calendly-style UI allowing students to pick their preferred interview time slot from available options.
- **Maps Integration:** Direct link to Google Maps if the interview is off-campus.
(i have not seen crate the database in such i can see these feauters)

## 4. Company Prep

### Backend Improvements
- **Content Moderation:** Endpoints for admins to approve user-submitted questions before they go public.
- **Tagging Engine:** Automatically extract tags (e.g., "Trees", "Dynamic Programming") from uploaded question text.
  (i have not seen crate the database in such i can see these feauters)
## 5. Internship Tracker
### Frontend Improvements
- **Verification Badges:** Show a blue tick once the placement cell verifies the internship certificate.
- **Experience Timeline:** A visually appealing timeline of all past internships.
the buttom below is clashing with the buttom bar and the button is also not working to add the internships
### Backend Improvements
- **Bulk Export:** Export internship data to Excel/CSV for NBA/NAAC accreditation reporting.
- **Fraud Detection:** Basic checks to flag suspicious entries (e.g., claiming a $10k/month stipend for a local startup).

## 6. Referral Hub
### Frontend Improvements
- **Template Generator:** Auto-generate professional outreach messages based on the student's profile and the requested company. before submitting these messages should be verified by studnets ,ediatble
- **Response Tracking:** Allow students to mark if an alumnus replied or provided the referral.

### Backend Improvements
- **Alumni Incentives:** Track which alumni give the most referrals and create a leaderboard or recognition system.add this feature to admin dashboard or realted to faculties
- **Rate Limiting:** Prevent students from spamming all alumni at once.

## 7. Mock Test Portal
the mcoks can be added by resoective dept faculities
### Frontend Improvements
- **Anti-Cheat UI:** Full-screen mode enforcement, tab-switch detection, and webcam monitoring (proctoring).
- **Detailed Analytics:** Post-test charts showing time spent per question and accuracy by topic.

### Backend Improvements
- **Question Bank Randomization:** Dynamic generation of tests pulling random questions from specific difficulty buckets.
- **Performance Scaling:** Ensure the testing engine can handle 1000+ simultaneous submissions without crashing.

in company prep i cant see any flash cards just make a tab for flash cards,community questions,company questions(which should be editable by admin and respective faculites),we should be able to add our own quetions and share them,also same for the mock tests we should be able to create our own mock tests and share them,and admin and respective faculties should be able to see all the mock tests and should be able to delete or edit them.