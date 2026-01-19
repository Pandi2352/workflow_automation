# Template Node Gap Analysis

This document analyzes the 5 proposed Real-World Templates and categorizes the required nodes into **Existing (Ready to Use)** and **Future (To Build)** based on the current system capabilities.

---

## 🏗️ Template 1: Intelligent Invoice Processing
*Automated end-to-end AP automation.*

| Node Type | Status | Notes |
| :--- | :--- | :--- |
| **Gmail** | ✅ **Done** | Can trigger on specific labels (e.g., "Invoices"). |
| **OCR** | ✅ **Done** | Gemini-powered OCR is implemented. |
| **Smart Extraction** | ✅ **Done** | Can extract schema-based fields (Invoice #, Date, Total). |
| **If/Else** | ✅ **Done** | Supports conditional logic (e.g., Total > 1000). |
| **MongoDB** | ✅ **Done** | Ready to insert extracted records. |
| **Approval UI** | 🚧 **Future** | While we have the logic, a dedicated "Human in the Loop" approval node/UI would be a powerful addition. |

---

## 🎫 Template 2: Customer Support Ticket Auto-Triage
*Auto-classify and route support emails.*

| Node Type | Status | Notes |
| :--- | :--- | :--- |
| **Outlook/Gmail** | ✅ **Done** | Both triggers are fully functional. |
| **Parsing (AI)** | ✅ **Done** | Can classify text intent (Urgent, Bug, Sales). |
| **Summarize** | ✅ **Done** | Generating short summaries is supported. |
| **HTTP Request** | ✅ **Done** | Can connect to Jira/Zendesk APIs generically. |
| **Jira / Zendesk** | 🚀 **Future** | Dedicated nodes with pre-built auth & actions would simplify this significantly (vs. raw HTTP). |

---

## 📉 Template 3: Competitor Price Monitoring
*Track and alert on website changes.*

| Node Type | Status | Notes |
| :--- | :--- | :--- |
| **Schedule** | ✅ **Done** | Cron-based triggering is ready. |
| **Scraper** | ✅ **Done** | Basic HTML scraping is implemented. |
| **Parsing (AI)** | ✅ **Done** | Can compare old vs. new values intelligently. |
| **Slack / Teams** | 🚀 **Future** | **Critical Miss**. Currently, you can only email alerts. Instant messaging is standard for functional monitoring. |

---

## 🎙️ Template 4: Meeting Minutes & Action Items
*Transcribe and summarize recordings.*

| Node Type | Status | Notes |
| :--- | :--- | :--- |
| **Google Drive** | ✅ **Done** | Can detect new audio files uploaded. |
| **Audio/Whisper** | 🚀 **Future** | **Major Gap**. We currently rely on a generic `Code` node or external APIs. A native `Speech-to-Text` node is essential here. |
| **Smart Extraction** | ✅ **Done** | Extracting "Action Items" list is supported. |
| **Google Docs** | 🚀 **Future** | Writing to a specific Google Doc currently requires complex HTTP OAuth setup. A dedicated "Write to Doc" node is needed. |

---

## 📊 Template 5: Social Media Sentiment Report
*Analyze brand sentiment periodically.*

| Node Type | Status | Notes |
| :--- | :--- | :--- |
| **Schedule** | ✅ **Done** | Weekly/Daily triggers ready. |
| **HTTP Request** | ✅ **Done** | Can fetch data from Twitter/LinkedIn APIs. |
| **Data Mapper** | ✅ **Done** | Essential for transforming API JSON responses. |
| **Parsing (Sentiment)**| ✅ **Done** | AI nodes handle sentiment analysis well. |
| **MongoDB** | ✅ **Done** | Archiving reports is supported. |
| **Twitter/LinkedIn** | 🚀 **Future** | Dedicated nodes would handle the complex OAuth 2.0 flows that are difficult in a raw HTTP node. |

---

## 📌 Summary: Top 5 Priorities for Future Dev
To fully enable these templates with a "No-Code" experience (removing the need for complex HTTP/Code configs), priority should be:

1.  **Slack / Teams Node**: For Template 3 (Monitoring).
2.  **Audio/Transcribe Node**: For Template 4 (Meetings).
3.  **Google Sheets / Docs Node**: For easier reporting in Templates 4 & 5.
4.  **Dedicated CRM Nodes (Jira/Salesforce)**: To replace raw HTTP requests in Template 2.
5.  **Human Approval Node**: To formalize the "Manager Approval" step in Template 1.
