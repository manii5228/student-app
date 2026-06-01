# Hybrid Mobile Application Conversion & Compilation Guide

This document describes how to compile the VelTech Student App into a native Android `.apk` file using **Capacitor** and share it with friends/colleagues.

---

## 1. How Capacitor Works

Capacitor wraps the compiled single-page React + Vite application (`dist/`) into a native Android WebKit container.
- It exposes native device features (e.g., biometric authentication, storage, secure keys) as unified JavaScript APIs.
- The web assets run locally on a embedded server inside the mobile app, providing quick page loads and smooth, native-like styling transitions.

---

## 2. Prerequisites for Android Compilation

To compile the native application into an APK, you will need the following tools installed on your development machine:
1. **Java Development Kit (JDK 17 or higher):** Required by Gradle (the Android build tool).
2. **Android Studio:** Offers the Android SDK, build tools, and platform APIs.
3. **Android SDK Packages:**
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools
   - Android SDK Build-Tools (matching target SDK version 34)

---

## 3. Development Workflow

We have added helper scripts to `frontend/package.json` to simplify mobile assets synchronization:

### Step 1: Build the Web App and Sync
Run this script to compile the Vite application and synchronize the built assets to the native Android directory:
```bash
npm run mobile:build
```
This executes:
1. `npm run build` (compiles web assets to `dist/`)
2. `npx cap sync` (copies the compiled assets to `android/app/src/main/assets/public/` and links plugins)

### Step 2: Open the Project in Android Studio
To compile, run, or debug the app on an emulator/device:
```bash
npx cap open android
```
This launches Android Studio with the `android/` workspace loaded.

---

## 4. Compiling the APK (Command Line)

If you have Java (JDK 17+) and the Android SDK path configured in your environment, you can compile the `.apk` directly from your command line without opening Android Studio.

### Step 1: Navigate to the Android Folder
```bash
cd android
```

### Step 2: Build the Debug APK
On Windows (PowerShell/CMD):
```powershell
.\gradlew.bat assembleDebug
```
On macOS/Linux:
```bash
./gradlew assembleDebug
```
This triggers Gradle to compile the Java/Kotlin classes and bundle them with the web assets into a signed debug APK.

### Step 3: Locate the Compiled APK
Once the compile succeeds, the generated `.apk` file will be located at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 5. Sharing the App via WhatsApp

Since the generated APK is signed with a debug key, it can be distributed easily to anyone for evaluation.

### Step-by-Step Distribution:
1. **Send the File:** Drag and drop the `app-debug.apk` directly into a WhatsApp Web chat or send it via WhatsApp on your desktop.
2. **Download on Mobile:** Ask your friends to click the `.apk` file in the WhatsApp chat on their Android phones to download it.
3. **Configure Permissions:**
   - When tapping the downloaded APK, Android will show a security warning: *"For your security, your phone is not allowed to install unknown apps from this source."*
   - Tap **Settings** in the popup.
   - Toggle **Allow from this source** to enable installations.
4. **Install and Run:** Go back and tap **Install** to load the VelTech Student App onto their mobile device!

---

## 6. Porting the Project to a New Machine with Android Studio & JDK 17+

If you are currently developing on a machine without Android Studio or a compatible Java version (JDK 17+), you can safely commit your changes and migrate to a fully equipped system later.

### Step-by-Step Porting Flow:

1. **Restore Node Dependencies:**
   On the new machine, navigate to the `frontend/` directory and restore package dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. **Sync the Web Assets:**
   Compile the latest React web application and synchronize the assets into the native Android folder:
   ```bash
   npm run mobile:build
   ```
   *(This runs `vite build` followed by `npx cap sync` internally).*

3. **Open or Compile:**
   - **Using Android Studio (Recommended):**
     Open the `android/` directory in Android Studio, or run:
     ```bash
     npx cap open android
     ```
     This allows you to run, debug, and test the app on a simulated emulator or connected physical device.
   - **Using the Command Line (Direct APK Build):**
     Compile the debug package directly via Gradle:
     ```bash
     cd android
     .\gradlew assembleDebug
     ```

4. **Locate the APK:**
   The compiled installation file will be generated and ready to share at:
   `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
