# Improvements: Career & Placements

## 1. Job Portal
### Frontend Improvements
- **Saved Jobs:** A bookmark feature to save interesting postings for later.
- **Application Tracker:** A visual pipeline (Applied -> Shortlisted -> Interview -> Offered) for tracking status.

### Backend Improvements
- **External API Aggregation:** Pulling public entry-level jobs from platforms like LinkedIn or Instahyre to supplement campus drives.
- **Automated Reminders:** Trigger emails 24 hours before a job application deadline.

## 2. Eligibility Check
### Frontend Improvements
- **"How to Qualify" Insights:** If ineligible, show exactly what needs to improve (e.g., "You need 0.2 more CGPA" or "Clear 1 arrear").
- **Eligibility Badges:** Quick visual tags on job cards indicating match percentage.

### Backend Improvements
- **Complex Rules Engine:** Handle complex company criteria (e.g., 60% in 10th, 65% in 12th, no history of backlogs).

## 3. Interview Scheduler
### Frontend Improvements
- **Slot Selection:** Calendly-style UI allowing students to pick their preferred interview time slot from available options.
- **Maps Integration:** Direct link to Google Maps if the interview is off-campus.

### Backend Improvements
- **Conflict Management:** Prevent students from booking overlapping interview slots.
- **Interviewer Dashboard:** APIs for external HR personnel to view the schedule and mark candidate status.

## 4. Company Prep
### Frontend Improvements
- **Flashcards Mode:** A quizlet-style flashcard interface for memorizing common HR questions.
- **Community Answers:** Allow students to submit and upvote their own answers to past interview questions.

### Backend Improvements
- **Content Moderation:** Endpoints for admins to approve user-submitted questions before they go public.
- **Tagging Engine:** Automatically extract tags (e.g., "Trees", "Dynamic Programming") from uploaded question text.

## 5. Internship Tracker
### Frontend Improvements
- **Verification Badges:** Show a blue tick once the placement cell verifies the internship certificate.
- **Experience Timeline:** A visually appealing timeline of all past internships.

### Backend Improvements
- **Bulk Export:** Export internship data to Excel/CSV for NBA/NAAC accreditation reporting.
- **Fraud Detection:** Basic checks to flag suspicious entries (e.g., claiming a $10k/month stipend for a local startup).

## 6. Referral Hub
### Frontend Improvements
- **Template Generator:** Auto-generate professional outreach messages based on the student's profile and the requested company.
- **Response Tracking:** Allow students to mark if an alumnus replied or provided the referral.

### Backend Improvements
- **Alumni Incentives:** Track which alumni give the most referrals and create a leaderboard or recognition system.
- **Rate Limiting:** Prevent students from spamming all alumni at once.

## 7. Mock Test Portal
### Frontend Improvements
- **Anti-Cheat UI:** Full-screen mode enforcement, tab-switch detection, and webcam monitoring (proctoring).
- **Detailed Analytics:** Post-test charts showing time spent per question and accuracy by topic.

### Backend Improvements
- **Question Bank Randomization:** Dynamic generation of tests pulling random questions from specific difficulty buckets.
- **Performance Scaling:** Ensure the testing engine can handle 1000+ simultaneous submissions without crashing.
