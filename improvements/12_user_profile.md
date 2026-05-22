# Improvements: User Profile

## 1. Digital Identity Card
### Frontend Improvements
- **Apple Wallet / Google Wallet Export:** Allow students to export their student ID card as a pass directly into their phone's native wallet.
- **Holographic Tilt Effect:** A 3D tilt effect on the digital ID card using device accelerometer data for a premium, anti-counterfeit feel.
- **Dynamic QR:** The ID card QR code refreshes every 15 seconds to prevent sharing screenshots for unauthorized access to campus facilities.

### Backend Improvements
- **TOTP Generation:** Implement Time-Based One-Time Passwords (TOTP) logic to generate the continuously rotating QR codes for the digital ID.
- **NFC Support:** Provide backend APIs that allow campus security NFC scanners to securely pull up the student's profile instantly.

## 2. Academic & Extracurricular Portfolio
### Frontend Improvements
- **Achievement Showcase:** A dedicated section that displays won hackathons, published papers, or club leadership roles with visually distinct icons.
- **Skill Endorsements:** Allow peers or faculty to "endorse" a student for specific skills (similar to LinkedIn), showing up on their public profile.
- **Public Profile Toggle:** An option to make certain parts of the profile "Public" with a shareable link for recruiters.

### Backend Improvements
- **Social Graph DB:** Use a graph database (like Neo4j) to map relationships between students, their projects, and their endorsements.
- **Automated Verification:** Logic to automatically verify and add certifications (like Coursera/NPTEL) if the student uploads a valid certificate ID.

## 3. Account Settings & Privacy
### Frontend Improvements
- **Granular Privacy Controls:** Toggles for "Who can see my phone number", "Who can see my CGPA" (e.g., Only Me, Friends, Faculty, Everyone).
- **Theme Preferences:** Settings to choose app themes, default start pages, and notification frequency.

### Backend Improvements
- **Data Export (GDPR Compliance):** A backend worker process that compiles all data associated with a user into a downloadable ZIP file when they request a data export.
- **Preference Syncing:** Store user preferences in the cloud so their customized experience is preserved even if they switch devices.

