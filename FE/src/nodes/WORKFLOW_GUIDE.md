# How to Achieve the "AI News Summary" Workflow

This guide details how to reconstruct the "Daily AI News Summary" workflow shown in your screenshots. It outlines the necessary nodes, how to build the missing ones, and the configuration steps.

## 1. Workflow Overview

**Goal:**  
Every day at 7:00 AM, fetch "Tech News" and "World News" from RSS feeds, use an AI Agent to summarize them into a readable format, clean up the output, and send the summary via Gmail.

**Flow Architecture:**
1.  **Trigger:** `Schedule Node` (7:00 AM)
2.  **Data Ingestion:** `RSS Feed Node` (x2: Tech & World)
3.  **Intelligence:** `AI Agent Node` (Summarization)
4.  **Formatting:** `Set / Output Node` (Data cleanup)
5.  **Delivery:** `Gmail Node` (Send email)

---

## 2. Nodes Required

We have some of these nodes, but to match the User Experience (UX) of the screenshots, we need to build two specific nodes and configuration interfaces.

### A. Existing Nodes (Ready to use)
*   **`Schedule Node`**: For the "Run every day at 7AM" trigger.
*   **`Gmail Node`**: For "Send summary by email".
*   **`Data Mapper Node`**: Can be used as the "Output/Set" node.

### B. New Nodes to Build (Recommended)
To achieve the exact look and feel:

1.  **`RSS Feed Node`**  
    *   **Purpose:** Simplify fetching and parsing RSS XML into JSON items.
    *   **Why:** Using the generic `HTTP Node` requires complex XML conversion logic. An `RSS Node` is "drag, drop, and paste URL".
    *   **Key Inputs:** `Feed URL`.

2.  **`AI Agent Node`**  
    *   **Purpose:** A high-level AI node distinct from `Code Node`.
    *   **Features:**
        *   Accepts multiple inputs (Context).
        *   "System Prompt" configuration (as seen in Image 2).
        *   "Model" selection (OpenAI/Gemini).
        *   Handles generic text processing without writing JavaScript.

---

## 3. Implementation Steps: Building the Missing Nodes

### Step 3.1: Build `RSS Feed Node`
*   **Frontend (`FE`):** Create `RSSNode.tsx` and `NodeConfigPanel.tsx`.
    *   Use `rss-parser` library in the backend (or frontend if CORS allows, but backend is safer).
    *   **UI:** Simple input field for "RSS Feed URL".
*   **Backend (`BE`):**
    *   Create an `RssService` that takes a URL, fetches the XML, and returns a standardized JSON array of articles (Title, Link, Summary, Date).

### Step 3.2: Build `AI Agent Node`
*   **Frontend (`FE`):** Create `AIAgentNode.tsx`.
    *   **UI:** A rich text area for "System Prompt" (like in Image 2).
    *   **Inputs:** Dynamic inputs to map data from previous nodes (e.g., `{{RSS_Tech.data}}`).
*   **Backend (`BE`):**
    *   Leverage your existing generic AI service.
    *   Construct the prompt: `System Prompt + Context Data = LLM Request`.

---

## 4. Configuration Guide (Step-by-Step)

Once the nodes are built, here is how you configure the workflow:

### 1. Triggers
*   **Start Here (Manual):** Default entry point for testing.
*   **Schedule Node:**
    *   **Interval:** `Daily`
    *   **Time:** `07:00:00`

### 2. Fetching News (The logic branch)
*   **Node 1: RSS Feed (Tech)**
    *   **URL:** `https://techcrunch.com/feed/` (or similar)
    *   *Output:* List of 10 recent items.
*   **Node 2: RSS Feed (World)**
    *   **URL:** `http://feeds.bbci.co.uk/news/world/rss.xml`
    *   *Output:* List of 10 recent items.

### 3. AI Summarization (The Brain)
*   **Node 3: AI Agent Node**
    *   **Input Connection:** Connect both RSS nodes to this node.
    *   **Prompt Configuration:**
        ```text
        Summarize world news and tech news from the last 24 hours based on the input data.
        
        Style constraints:
        - Skip your comments ("Here is the summary...").
        - Group by "World News" and "Tech News".
        - Use bullet points.
        - Tone: Professional & Concise.
        
        Context Data:
        Tech: {{RSS_Tech.output}}
        World: {{RSS_World.output}}
        
        Today is {{ $today }}
        ```
    *   **Model:** `Gemini 1.5 Flash` (or OpenAI if configured).

### 4. Output Formatting
*   **Node 4: Data Mapper (or Set Node)**
    *   **Purpose:** extract just the text string for the email.
    *   **Field:** `email_body`
    *   **Value:** `{{AI_Agent.output.text}}`

### 5. Delivery
*   **Node 5: Gmail Node**
    *   **Action:** `Send Email`
    *   **To:** `me@example.com`
    *   **Subject:** `Daily Brief: {{ $today }}`
    *   **Body:** `{{Data_Mapper.email_body}}` (or directly from Agent node)

---

## 5. Visualizing the Graph
To visually match the screenshot:
1.  Place **Schedule** and **Manual Trigger** on the left.
2.  Place **AI Agent** in the center.
3.  Connect Triggers -> Agent.
4.  *Note:* The screenshot shows "Get Tech News" as "Tools" feeding *into* the Agent. In our architecture, standard flow is `RSS -> Agent`.
    *   **Visual Tweak:** You can place RSS nodes *below* the Agent and connect them, or have them run *before* the Agent node in the sequence.
    *   **Recommended Flow:** `Schedule -> RSS (Tech) -> RSS (World) -> AI Agent -> Gmail`.
    *   *Why?* It ensures the data is fetched *before* the agent tries to summarize it.

