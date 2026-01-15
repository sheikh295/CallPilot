
# S4W Full-Stack Assessment – Outbound Voice AI Mini Platform

## Goal
Build a small end-to-end flow that allows a user to:
1. Create an outbound call to a contact
2. Launch outbound call (real or simulated)
3. Capture call outcomes and transcripts
4. View results in a simple dashboard

> Expected time: ~1 day

---

## Tech Expectations
Recommended (not mandatory):
- Next.js + TypeScript
- PostgreSQL (Supabase preferred)
- Any clean backend/API approach

**Voice AI Options**
- Option A: Vapi integration (preferred)
- Option B: Mock voice provider (simulation)

---

## Backend Requirements

### Data Models (Minimum)

#### Contact
- id
- name
- phone_number
- created_at

#### Call
- id
- contact_id
- status (queued, in_progress, completed, failed, no_answer)
- outcome
- transcript
- summary
- structured_output (JSON)
- created_at
- updated_at

---

### API Behaviour
At minimum, support:
- Creating a call
- Adding contacts (manual entry; CSV optional)
- Launching a call (creates call records)
- Receiving call updates via a secure webhook-style endpoint

---

## Voice AI Implementation

### Option A: Vapi (Preferred)
- Trigger outbound call
- Handle call lifecycle callbacks
- Store transcript and call outcome

### Option B: Mock Implementation
If Vapi is not used:
- Simulate outbound calls via background jobs or API actions
- Transition calls through realistic states
- Generate fake transcript and outcome
- Send updates through the same webhook endpoint

> Call lifecycle design matters more than provider choice.

---

## Frontend Requirements

### 1. Call
- Create call
- Agent prompt generator
- Call goals input
- Save call

### 2. Contacts
- Add contacts
- Basic validation

### 3. Launch & Monitor
- Launch button
- List of calls with:
  - status
  - outcome
- Ability to click a call and view:
  - transcript
  - summary

UI should be clean and usable; heavy styling not required.

---

## AI Prompt & Output
Design the agent prompt to collect structured information such as:
- Was the contact interested?
- Any objections?
- Preferred callback time (if applicable)

Store:
- Short human-readable summary
- Structured JSON output

---

## Bonus (Optional)
- Concurrency limits (only N calls active at once)
- Retry logic for unanswered calls
- Simple analytics (counts by outcome)
- Basic authentication
- Webhook signature verification

---

## Deliverables
Please submit:
- GitHub repository
- README including:
  - Setup instructions
  - Architecture overview
  - Key decisions & trade-offs
  - What you would build next with more time

Optional:
- Short Loom walkthrough (2–3 minutes)

---

## What We’re Evaluating
- System design and data modeling
- Backend correctness and robustness
- Frontend usability
- AI judgment and prompt design
- Ability to scope and ship pragmatically
- Personal flare and ideas

> This is not a test of perfection — it’s a test of engineering judgment.
