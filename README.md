# Gemini LifeLens

A secure personal AI journal and memory system built with **Google Gemini 3.8 Flash**, **Firebase Authentication (Google Sign-In)**, and **Cloud Firestore**, running serverless on **Google Cloud Run**.

Every journal entry, multi-turn AI reflection, structured memory, and synthesis summary is strictly isolated to the authenticated user using owner-bound Firestore security rules.

---

## 🌐 Public Deployed Application

- **Live Application URL**: https://geminilifelens.ai.studio/
- **Development Service URL**: [https://ais-dev-axevvu52ljm75iwotj2dmd-513733059821.asia-southeast1.run.app](https://ais-dev-axevvu52ljm75iwotj2dmd-513733059821.asia-southeast1.run.app)
- **Required Cloud Run Label**:
  ```yaml
  dev-tutorial: cloud-run-ai-challenge
  ```
- **Region**: `asia-southeast1`
- **Container Port**: `3000`

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Gemini LifeLens Features](#gemini-lifelens-features)
4. [Prerequisites](#prerequisites)
5. [Google Cloud Project Setup](#google-cloud-project-setup)
6. [Firebase Setup & Google Sign-In Configuration](#firebase-setup--google-sign-in-configuration)
7. [Firestore Setup & Security Rules](#firestore-setup--security-rules)
8. [Gemini Configuration & Reliability Ladder](#gemini-configuration--reliability-ladder)
9. [Secret Manager Setup & IAM Permissions](#secret-manager-setup--iam-permissions)
10. [Local Development](#local-development)
11. [Environment Configuration](#environment-configuration)
12. [API Endpoints](#api-endpoints)
13. [Cloud Run Deployment & Verification Label](#cloud-run-deployment--verification-label)
14. [Production Verification](#production-verification)
15. [Security Architecture & Considerations](#security-architecture--considerations)
16. [Testing Instructions & Walkthroughs](#testing-instructions--walkthroughs)
17. [Third-Party Integrations](#third-party-integrations)
18. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Gemini LifeLens** is an enterprise-grade, privacy-first personal AI journal. While conventional AI chat applications send arbitrary transcripts to language models with zero structural data isolation, Gemini LifeLens enforces strict multi-tenant boundaries:
- Authentication is governed by Google Identity Services (Firebase Auth).
- Storage is partitioned strictly at `/users/{userId}/interactions/{interactionId}`.
- Gemini is treated strictly as an untrusted reasoning and generative component—never as an authorization mechanism.
- All generative requests are proxied via a full-stack Express server to keep `GEMINI_API_KEY` hidden from the client browser.

---

## Architecture

```
                                  +---------------------------+
                                  |    Browser / Client SPA   |
                                  | React 18 + Tailwind + Vite|
                                  +-------------+-------------+
                                                |
               +--------------------------------+-------------------------------+
               | HTTPS / WebSockets                                              | HTTPS (ID Token)
               v                                                                 v
+-----------------------------+                                    +-----------------------------+
|    Cloud Run Service        |                                    |       Cloud Firestore       |
|  Express Server (Port 3000) |                                    |      (Owner Isolated)       |
+--------------+--------------+                                    |  /users/{uid}/interactions  |
               |                                                   +-----------------------------+
               v                                                                 ^
+-----------------------------+                                                  |
|   Gemini 3.6 Flash Engine   |                                                  |
|  (Server-Side API Proxy)    |--------------------------------------------------+
+-----------------------------+
```

| Component | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Lucide Icons | Responsive single-screen reflection canvas with dark aesthetic (`#0a0a0a`), history drawer, mode switching, and real-time filtering. |
| **Backend API** | Node.js 22, Express 4.x, Vite Middleware | Server-side proxy handling `/api/gemini/reflect` and `/api/health`. Zero frontend credential exposure. |
| **Identity** | Firebase Auth (Google Sign-In) | Client-side federated popup authentication via Google Identity Services (GSI). No passwords stored. |
| **Database** | Cloud Firestore | Owner-bound hierarchical subcollections ensuring strict tenancy isolation (`request.auth.uid == userId`). |
| **Generative AI** | Google Gen AI SDK (`@google/genai`) | Multi-turn reflections, executive synthesis, and automatic failover ladder across Gemini models. |
| **Deployment** | Google Cloud Run (Containerized) | Bound to port `3000` on `0.0.0.0` with mandatory competition label `dev-tutorial=cloud-run-ai-challenge`. |

---

## Gemini LifeLens Features

1. **Personal Memory & Reflection Stream**: Multi-turn dialogue allowing users to explore decisions, unpack thoughts, and navigate complex emotional landscapes.
2. **Executive Synthesis**: One-click holistic synthesis condensing sprawling multi-turn dialogue into structured takeaways, insights, and framing questions.
3. **Mode Switching**: Dynamically switch conversational posture between **Reflect** (empathetic inquiries), **Summary** (concise executive briefs), and **Brainstorm** (divergent ideation).
4. **Resilient AI Failover Ladder**: Automatic server-side fallback from `gemini-3.6-flash` down to `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.7-flash` when encountering rate limits or transient outages.
5. **Real-Time History & Search**: Instantaneous client-side and Firestore-backed search across previous entries by title, mode, and keywords.
6. **One-Click Markdown Export**: Download clean `.md` transcripts of any reflection session including dates, mode badges, summaries, and full conversation history.

---

## Prerequisites

- **Google Cloud Platform Account** with an active billing account.
- **Google Cloud CLI (`gcloud`)** installed and authenticated (`gcloud auth login`).
- **Node.js 20+** and **npm** installed locally.
- **Firebase Project** created or linked to your Google Cloud Project.

---

## Google Cloud Project Setup

Set your active project and configure the default region:

```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="us-central1"

gcloud config set project $PROJECT_ID
```

Enable all required Google Cloud APIs:

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  generativelanguage.googleapis.com
```

---

## Firebase Setup & Google Sign-In Configuration

1. In the [Firebase Console](https://console.firebase.google.com/), select your Google Cloud project.
2. Navigate to **Build > Authentication > Sign-in method**.
3. Enable **Google** as a Sign-in provider. Fill in your project support email and save.
4. Under **Settings > Authorized domains**, ensure your Cloud Run domain (e.g. `*.run.app`) and `localhost` are listed.
5. In **Project Settings > General**, register a Web App (e.g., `gemini-lifelens-web`) and copy the Firebase configuration credentials.

---

## Firestore Setup & Security Rules

1. Navigate to **Build > Firestore Database** in the Firebase Console.
2. Create a database in Native Mode in your target region (e.g., `us-central1`).
3. Deploy the strict owner-isolation security rules:

### `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Zero Insecure Defaults: Default deny catch-all
    match /{document=**} {
      allow read, write: if false;
    }

    // User Data Isolation: Owner-bound path checking
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## Gemini Configuration & Reliability Ladder

The backend initializes `@google/genai` server-side:

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});
```

### Reliability Failover Ladder
To ensure zero user downtime during transient 429 rate limits, 503 capacity spikes, or regional outages, the backend implements an automated model fallback ladder:
1. `gemini-3.8-flash` (Primary high-performance model)
2. `gemini-3.5-flash` (First fallback — verified fast & reliable)
3. `gemini-3.1-flash-lite` (Lightweight low-latency fallback)
4. `gemini-flash-latest` (Stable fallback alias)

If an upstream generation error occurs or high demand is reported, the server immediately proceeds down the ladder before gracefully returning a clean, actionable error payload.

Additionally, if `GEMINI_API_KEY` is missing or unauthorized, the server automatically transitions to **Google Cloud Application Default Credentials (ADC)** via `google-auth-library`.

---

## Secret Manager Setup & IAM Permissions

Store the Gemini API Key in Google Cloud Secret Manager to prevent plaintext secrets from entering the codebase or client bundles:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API Key as secret version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Obtain your Compute Engine default service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# 4. Grant Secret Accessor role to the Cloud Run service account
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Local Development

1. Clone the repository:
   ```bash
   git clone <REPO_URL>
   cd gemini-lifelens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server (runs full-stack Express + Vite on port 3000):
   ```bash
   npm run dev
   ```

5. Open your browser at `http://localhost:3000`.

---

## Environment Configuration

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-Side Only | Google Gen AI API key. Never exposed to the client. |
| `VITE_FIREBASE_API_KEY` | Client-Side | Public Firebase web configuration key for GSI auth. |
| `VITE_FIREBASE_AUTH_DOMAIN`| Client-Side | Firebase Auth domain. |
| `VITE_FIREBASE_PROJECT_ID` | Client-Side | Google Cloud / Firebase Project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Client-Side | Cloud Storage bucket reference. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Client-Side | Firebase messaging sender identifier. |
| `VITE_FIREBASE_APP_ID` | Client-Side | Firebase web application identifier. |

---

## API Endpoints

### `GET /api/health`
- **Purpose**: Liveness and readiness probe for Cloud Run container monitoring.
- **Auth**: Public.
- **Response**:
  ```json
  {
    "status": "ok",
    "hasGeminiKey": true,
    "timestamp": "2026-09-06T00:00:00.000Z"
  }
  ```

### `POST /api/gemini/reflect`
- **Purpose**: Generates multi-turn reflections, executive synthesis, or brainstorming insights.
- **Auth**: Server-side proxy handling client journal sessions.
- **Request Body**:
  ```json
  {
    "prompt": "I am deciding whether to pivot our product roadmap.",
    "history": [
      { "role": "user", "content": "Initial thoughts on our quarterly direction." },
      { "role": "model", "content": "What are the primary metrics driving this thought?" }
    ],
    "mode": "reflection",
    "isNewSession": false
  }
  ```
- **Response**:
  ```json
  {
    "text": "Evaluating a strategic roadmap pivot requires balancing market signals...",
    "modelUsed": "gemini-3.8-flash",
    "titleSuggestion": "Strategic Roadmap Pivot"
  }
  ```

---

## Cloud Run Deployment & Verification Label

### 1. Build and Deploy
Deploy the service to Cloud Run directly from source. The container runs on port 3000 and mounts the Gemini API key from Secret Manager:

```bash
gcloud run deploy gemini-lifelens \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

### 2. Apply Mandatory Competition Verification Label
To satisfy verification for the Cloud Run AI Challenge, apply the required service label:

#### Option A: Via Google Cloud CLI (Recommended - Bypasses Console UI Glitches)
If you encounter errors like *"Unable to save labels"* in the Google Cloud Console web UI, run this single CLI command:

```bash
gcloud run services update gemini-lifelens \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

*(Replace `gemini-lifelens` with your service name and `us-central1` with your service region if different)*.

#### Option B: Via Google Cloud Console Web UI
When entering labels into the Google Cloud Console:
1. Go to **Cloud Run** > Click your service (`gemini-lifelens`).
2. Click **"Edit & Deploy New Revision"** or the **"Labels"** tab at the top.
3. Under Labels:
   - **Key**: `dev-tutorial`
   - **Value**: `cloud-run-ai-challenge`
4. **Common UI Pitfalls**:
   - Ensure there are **no leading or trailing whitespace spaces** in either the Key or Value field.
   - Do not leave empty label rows (if an empty row exists, click the trash can icon next to it before clicking Save).
   - Label keys must begin with a lowercase letter and contain only lowercase letters, digits, underscores (`_`), and hyphens (`-`).
5. Click **"Save"** or **"Deploy"**.

Verify that the label is applied:
```bash
gcloud run services describe gemini-lifelens \
  --region=us-central1 \
  --format="value(metadata.labels)"
```
*(The output must contain `dev-tutorial: cloud-run-ai-challenge`)*.

---

## Production Verification

Run the following checks to confirm production readiness:

1. **Liveness Probe**:
   ```bash
   curl -s https://<YOUR_CLOUD_RUN_URL>/api/health
   # Expected: {"status":"ok","hasGeminiKey":true,...}
   ```

2. **SPA Routing**:
   Requesting any non-API route returns `index.html` with status `200 OK`.

3. **HTTPS Redirection**:
   Cloud Run automatically terminates TLS and routes HTTP to HTTPS.

---

## Security Architecture & Considerations

1. **OWASP Top 10 & LLM Risk Controls**:
   - **No Secret Leakage**: Zero API keys are stored in client bundles or client-facing responses.
   - **Strict Path Isolation**: Firestore rules prevent User A from enumerating or reading User B's subcollections.
   - **Indirect Prompt Injection Defense**: Journal content is enclosed within strict delimiter tags and evaluated as untrusted data.
   - **Input Sanitization & Bounds**: All input is validated with strict maximum character boundaries.
   - **Zero Dynamic Code Execution**: Gemini outputs are rendered as safe text/markdown, never evaluated via `eval()` or executed in runtime environments.

---

## Testing Instructions & Walkthroughs

### Test Case 1: Unauthenticated Landing Screen
- **Action**: Open the application in an incognito browser window.
- **Expected**: Clean dark landing view renders; no user entries are visible; "Sign In with Google" and "Explore Sandbox" buttons are available.

### Test Case 2: Google Sign-In Flow
- **Action**: Click "Sign In with Google" and authenticate.
- **Expected**: Redirects immediately to private reflection canvas; avatar and email appear in top navigation.

### Test Case 3: Multi-Turn Dialogue
- **Action**: Click "Daily Debrief" starter prompt, submit, and send a follow-up inquiry.
- **Expected**: Both turns render smoothly in conversational bubbles; model metadata badge shows the active Gemini model.

### Test Case 4: Executive Synthesis
- **Action**: In an active entry with at least two turns, click "Synthesize".
- **Expected**: A dedicated card appears above the dialogue containing a markdown executive summary and a functional "Copy" button.

### Test Case 5: Tenancy & Firestore Isolation
- **Action**: Create an entry under User 1. Log out and log in as User 2.
- **Expected**: User 2 sees an empty history list and cannot read or search User 1's reflections.

---

## Third-Party Integrations

- **Google Identity Services (GSI)**: Used for secure, frictionless federated Google Sign-In.
- **Google Cloud Secret Manager**: Used for encrypted server-side secret injection.
- **Google Cloud Run**: Serverless container runtime with autoscaling and HTTPS ingress.

---

## Security Advisory & Secret Alert Resolution (GitHub Alert Remediation)

### Incident Context: Google API Key Detected in `firebase-applet-config.json`
When committing project files to a remote git repository (e.g., `gish27/geminilifelens` commit `144b9955`), GitHub Secret Scanning flags the `apiKey` field in `firebase-applet-config.json` (`AIzaSy...`).

Even though Firebase Web Client API keys identify a project and are not traditional private secrets, committing them into public git repositories triggers automated secret scanning alerts and leaves the key vulnerable to quota exhaustion if unrestricted.

### Remediation Protocol

#### 1. Untrack `firebase-applet-config.json` from Git
Run the following commands in your local repository clone to delete the file from git tracking without deleting it from your local workspace:

```bash
# Untrack the sensitive config file from git
git rm --cached firebase-applet-config.json

# Commit the removal
git commit -m "security: remove firebase-applet-config.json from git tracking"

# Push to your GitHub repository
git push origin main
```

#### 2. Rotate the Exposed Google API Key
1. Navigate to the **[Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials?project=citric-rex-w18qq)**.
2. Locate the exposed API Key (`AIzaSyChsatZs3B5a2iaJpfiJzJzZase1Q6EvYU`).
3. Click **+ CREATE CREDENTIALS** > **API key** to generate a fresh, replacement API key.
4. Update your local `.env` or `firebase-applet-config.json` with the new key.
5. In Google Cloud Console, click the three dots next to the old exposed key and select **Delete credential** (or revoke it) once your app is verified with the new key.

#### 3. Enforce API Key Restrictions (Hardening)
To prevent unauthorized use even if a key is discovered:
1. Open the replacement API key in **Google Cloud Console > Credentials**.
2. Under **Application restrictions**, choose **Websites (HTTP referrers)**:
   - `https://ais-pre-axevvu52ljm75iwotj2dmd-513733059821.asia-southeast1.run.app/*`
   - `https://ais-dev-axevvu52ljm75iwotj2dmd-513733059821.asia-southeast1.run.app/*`
   - `http://localhost:*/*`
3. Under **API restrictions**, select **Restrict key**:
   - Check **Firebase Authentication API**
   - Check **Cloud Firestore API**
   - Leave all other APIs (Generative Language, Compute, Billing, etc.) unselected.
4. Click **Save**.

#### 4. Resolve the GitHub Secret Scanning Alert
1. In your GitHub repository (`https://github.com/gish27/geminilifelens`), click on the **Security** tab.
2. Select **Secret scanning alerts** from the left navigation.
3. Locate the alert for `firebase-applet-config.json#L4` (commit `144b9955`).
4. Click **Close alert as** > **Revoked** (after deleting the old key in Cloud Console) or **Fixed in commit**.

---

## Troubleshooting

- **Error: `Missing GEMINI_API_KEY environment variable`**
  - Verify that the secret is bound in Cloud Run (`--set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"`).
  - Verify that the service account has the `roles/secretmanager.secretAccessor` role.
- **Error: `Firebase: Error (auth/unauthorized-domain)`**
  - Add your Cloud Run domain to **Firebase Console > Authentication > Settings > Authorized Domains**.
- **Error: `Missing or insufficient permissions (Firestore)`**
  - Verify that the user is signed in with a valid Google account.
  - Verify that `firestore.rules` has been deployed and enforces `request.auth.uid == userId`.

