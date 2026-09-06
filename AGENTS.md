# Security Architecture Directives

## 1. Google Maps Directive (Secure Maps API & Key Architecture)
- **Zero Client-Side Secret Leakage**: Client-side Google Maps JavaScript API keys must strictly use HTTP referrer restrictions (e.g. your Cloud Run domain). Server-side Geocoding or Places Web Service APIs must be routed exclusively through server endpoints (`/api/maps/*`) utilizing `GOOGLE_MAPS_API_KEY` stored in Secret Manager or environment secrets.
- **Location Data Privacy**: Location coordinates (latitude, longitude, formatted address, place ID) attached to journal entries are sensitive personal data. They must remain strictly within the user's isolated document subcollection (`/users/{userId}/interactions/{interactionId}`) and never broadcast to public feeds or shared caches.
- **Graceful Degradation**: If a Google Maps API key is not configured or fails to load, provide an intuitive fallback coordinate & location name selector with interactive manual entry or browser geolocation API support, ensuring zero app crashes.

## 2. Admin Roles & RBAC Directive (Role-Based Access Control)
- **Authoritative Server-Side Validation**: Never determine admin privileges from client-side state, unverified user claims, `localStorage`, or request body fields (e.g., `req.body.isAdmin` is strictly forbidden).
- **Admin Verification Source**: In Firebase/Cloud Run architectures, admin privileges are granted strictly via:
  1. Authoritative Firestore document lookup at `/roles_admin/{userId}` with strict read-only security rules.
  2. Or server-side verification of explicit server-configured admin emails (`ADMIN_EMAILS` environment variable) combined with a cryptographically verified Firebase ID token.
- **Least Privilege Access**: Regular users can ONLY access their own isolated paths (`/users/{userId}/*`). Admin endpoints (`/api/admin/*`) require server-side token verification and admin role confirmation before returning system diagnostics, tenant statistics, or audit metrics.

## 3. External Notifications Directive (Slack / Discord / Webhook)
- **Secure Webhook Handling**: Webhook URLs (Slack incoming webhooks, Discord channels, custom notification endpoints) contain sensitive authentication tokens within their URLs. Never expose webhook URLs to client bundles or browser dev tools.
- **Server-Side Proxy Dispatch**: Client applications trigger notifications by calling an authenticated server endpoint (`/api/notifications/dispatch`). The backend validates the user's session, sanitizes the payload, parses entry classification (e.g., milestone, critical reflection, goal achieved), and performs the outbound webhook POST.
- **Payload Schema Standardization**:
  ```json
  {
    "eventType": "milestone_detected" | "urgent_reflection" | "daily_summary",
    "title": "Clean sanitized title",
    "timestamp": "ISO 8601 string",
    "channel": "slack" | "discord" | "email",
    "metadata": { "location": "Optional City, Country" }
  }
  ```
- **Strict Rate Limiting & Anti-SSRF**: Outbound webhooks must validate destination URLs against allowed hosts (e.g., `hooks.slack.com`, `discord.com/api/webhooks`), reject internal network addresses (e.g., `127.0.0.1`, `169.254.169.254` metadata service), and throttle dispatches per user.
