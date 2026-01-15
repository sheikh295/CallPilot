# PROJECT BREAKDOWN: CallPilot - Outbound Voice AI Platform

## 🎯 CLIENT REQUIREMENTS SUMMARY

The client needs a mini platform that enables:
1. **Creating outbound calls** to contacts
2. **Launching calls** (using Vapi or mock simulation)
3. **Capturing call outcomes, transcripts, and summaries**
4. **Viewing results** in a dashboard

**Timeline**: Complete by EOD (1 day assessment)

---

## 🏗️ TECH STACK

- **Frontend**: Next.js + TypeScript
- **Backend**: Nest.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Voice AI**: Vapi integration
- **Architecture**: Monorepo

---

## 📦 DELIVERABLES

### Core Deliverables (MUST-HAVE)

1. **Backend APIs**
   - ✅ Create contact endpoint
   - ✅ Create call endpoint
   - ✅ Launch call endpoint (triggers Vapi)
   - ✅ Webhook endpoint (receives Vapi callbacks)
   - ✅ Get calls list endpoint
   - ✅ Get call details endpoint

2. **Database Schema**
   - ✅ Contacts table (id, name, phone_number, created_at)
   - ✅ Calls table (id, contact_id, status, outcome, transcript, summary, structured_output, created_at, updated_at)

3. **Frontend Pages**
   - ✅ Create Call page (with agent prompt generator, call goals)
   - ✅ Contacts page (add contacts, validation)
   - ✅ Launch & Monitor page (call list with status/outcome)
   - ✅ Call Details view (transcript & summary)

4. **Vapi Integration**
   - ✅ Trigger outbound calls
   - ✅ Handle lifecycle callbacks
   - ✅ Store transcript and outcomes

5. **AI Prompt Design**
   - ✅ Structured data collection (interest level, objections, callback time)
   - ✅ Generate human-readable summary
   - ✅ Generate structured JSON output

6. **Documentation**
   - ✅ README with setup instructions
   - ✅ Architecture overview
   - ✅ Key decisions & trade-offs
   - ✅ Future improvements

### Bonus Deliverables (NICE-TO-HAVE)
   - ⭐ Concurrency limits (N active calls max)
   - ⭐ Retry logic for unanswered calls
   - ⭐ Simple analytics (outcome counts)
   - ⭐ Basic authentication
   - ⭐ Webhook signature verification
   - ⭐ CSV import for contacts
   - ⭐ Loom walkthrough video (2-3 min)

---

## 🔨 IMPLEMENTATION BREAKDOWN

### Phase 1: Project Setup (30 min)
- [ ] Initialize monorepo structure
- [ ] Setup Next.js frontend
- [ ] Setup Nest.js backend
- [ ] Configure Supabase connection
- [ ] Setup environment variables

### Phase 2: Database & Backend Core (2 hours)
- [ ] Create Supabase tables (Contacts, Calls)
- [ ] Setup Nest.js modules (Contacts, Calls, Vapi)
- [ ] Implement Contact CRUD endpoints
- [ ] Implement Call creation endpoint
- [ ] Setup DTOs and validation

### Phase 3: Vapi Integration (2 hours)
- [ ] Setup Vapi SDK/API client
- [ ] Implement launch call logic
- [ ] Create webhook endpoint for callbacks
- [ ] Handle call lifecycle (queued → in_progress → completed)
- [ ] Parse and store transcript, summary, structured output

### Phase 4: Frontend Implementation (3 hours)
- [ ] Setup Next.js pages and routing
- [ ] Create Call page (form with prompt generator, goals)
- [ ] Create Contacts page (add contact form)
- [ ] Create Launch & Monitor page (calls table)
- [ ] Create Call Details modal/page
- [ ] Add basic styling (Tailwind CSS)

### Phase 5: AI Prompt Engineering (1 hour)
- [ ] Design agent prompt template
- [ ] Add structured data extraction instructions
- [ ] Test with sample scenarios
- [ ] Refine for optimal responses

### Phase 6: Testing & Polish (1.5 hours)
- [ ] End-to-end testing
- [ ] Fix bugs
- [ ] Add error handling
- [ ] Improve UI/UX

### Phase 7: Documentation (30 min)
- [ ] Write comprehensive README
- [ ] Document architecture decisions
- [ ] Add setup instructions
- [ ] List future improvements

---

## 🎬 USER WORKFLOW

**Complete User Journey:**
1. User adds contact(s) → **Contacts Page**
2. User creates a call config (prompt, goals) → **Create Call Page**
3. User launches call → **Launch Button**
4. System triggers Vapi → **Backend API**
5. Vapi makes call & sends updates → **Webhook**
6. User views results → **Monitor Page**
7. User clicks call to see details → **Call Details**

---

## 🗂️ DATA MODELS

### Contact Model
```typescript
{
  id: string (uuid)
  name: string
  phone_number: string
  created_at: timestamp
}
```

### Call Model
```typescript
{
  id: string (uuid)
  contact_id: string (foreign key)
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'no_answer'
  outcome: string (nullable)
  transcript: text (nullable)
  summary: text (nullable)
  structured_output: json (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 🔄 CALL STATUS FLOW

```
queued → in_progress → completed/failed/no_answer
```

### Status Definitions
- **queued**: Call created, waiting to be initiated
- **in_progress**: Call is actively happening
- **completed**: Call finished successfully with outcome
- **failed**: Call encountered an error
- **no_answer**: Contact didn't answer

---

## 📊 STRUCTURED OUTPUT EXAMPLE

```json
{
  "interested": true,
  "interest_level": "high",
  "objections": [
    "price too high",
    "needs approval from manager"
  ],
  "callback_time": "2026-01-20T14:00:00Z",
  "callback_requested": true,
  "next_steps": "Follow up with pricing options and case studies",
  "decision_maker": false,
  "budget_confirmed": false,
  "timeline": "Q1 2026"
}
```

---

## 🤖 AI AGENT PROMPT COMPONENTS

The agent prompt should include:

1. **Context**
   - Company name and product/service
   - Call objective
   - Contact background (if available)

2. **Instructions**
   - Conversational tone
   - Questions to ask
   - Objection handling
   - When to schedule callback

3. **Data Collection**
   - Interest level
   - Objections or concerns
   - Preferred callback time
   - Decision-making authority
   - Budget/timeline info

4. **Output Format**
   - Request structured JSON at end
   - Generate concise summary
   - Include action items

---

## 🏛️ SYSTEM ARCHITECTURE

```
┌─────────────────┐
│   Next.js FE    │
│  (TypeScript)   │
└────────┬────────┘
         │
         │ REST API
         │
┌────────▼────────┐
│   Nest.js BE    │◄─────── Vapi Webhooks
│  (TypeScript)   │
└────────┬────────┘
         │
         │ SQL
         │
┌────────▼────────┐
│    Supabase     │
│  (PostgreSQL)   │
└─────────────────┘
```

---

## 🔌 API ENDPOINTS

### Contacts
- `POST /contacts` - Create contact
- `GET /contacts` - List contacts
- `GET /contacts/:id` - Get contact details

### Calls
- `POST /calls` - Create call configuration
- `GET /calls` - List all calls
- `GET /calls/:id` - Get call details
- `POST /calls/:id/launch` - Launch/trigger call

### Webhooks
- `POST /webhooks/vapi` - Handle Vapi callbacks

---

## 🔐 WEBHOOK SECURITY

### Basic Implementation
- Verify webhook signature from Vapi
- Validate payload structure
- Return 200 OK quickly
- Process async if needed

### Headers to Check
- `x-vapi-signature` or similar
- Timestamp validation
- IP whitelist (optional)

---

## 📈 ANALYTICS (Bonus)

Simple metrics to track:
- Total calls made
- Calls by status
- Success rate (completed vs failed)
- Average call duration
- Outcomes summary
- Interest level distribution

---

## 🧪 TESTING STRATEGY

### Manual Testing
1. Create contact
2. Create call with prompt
3. Launch call
4. Verify status updates
5. Check transcript/summary display

### Edge Cases
- Invalid phone numbers
- Missing contacts
- Failed API calls
- Webhook timeout
- Duplicate launches

---

## 🚀 DEPLOYMENT CONSIDERATIONS

### Environment Variables
```env
# Backend
DATABASE_URL=<supabase-connection-string>
VAPI_API_KEY=<vapi-key>
VAPI_WEBHOOK_SECRET=<webhook-secret>
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Development
- Backend: `localhost:4000`
- Frontend: `localhost:3000`
- Database: Supabase cloud

---

## 🎯 EVALUATION CRITERIA

The client is evaluating:

1. ✅ **System design & data modeling**
   - Clean database schema
   - Proper relationships
   - Scalable architecture

2. ✅ **Backend correctness & robustness**
   - Error handling
   - Validation
   - Webhook reliability

3. ✅ **Frontend usability**
   - Intuitive UI
   - Clear feedback
   - Easy navigation

4. ✅ **AI prompt design & judgment**
   - Effective data collection
   - Natural conversation
   - Structured outputs

5. ✅ **Pragmatic scoping**
   - MVP focus
   - Smart trade-offs
   - Shippable product

6. ✅ **Personal flare & ideas**
   - Creative solutions
   - Extra touches
   - Future vision

---

## ⚡ PRIORITY ORDER

### P0 (Critical Path - Must Complete)
- Database schema
- Basic CRUD APIs
- Vapi integration
- Call lifecycle management
- Simple frontend forms
- Webhook handling

### P1 (Important - Should Complete)
- Clean UI/UX
- Error handling
- Data validation
- Webhook security
- Documentation

### P2 (Nice to Have - If Time Permits)
- Analytics dashboard
- Retry logic
- Authentication
- CSV import
- Concurrency limits

---

## 🔮 FUTURE IMPROVEMENTS

Ideas for "What would you build next":

1. **Enhanced Features**
   - Bulk calling
   - Call scheduling
   - Call recording playback
   - Multi-language support

2. **Analytics & Reporting**
   - Detailed analytics dashboard
   - Export reports
   - Call performance metrics
   - A/B test different prompts

3. **Advanced AI**
   - Dynamic prompt generation
   - Sentiment analysis
   - Real-time call monitoring
   - Agent training mode

4. **User Management**
   - Multi-user support
   - Role-based access
   - Team collaboration
   - Call assignment

5. **Integrations**
   - CRM integration
   - Calendar booking
   - Email follow-ups
   - SMS notifications

6. **Scale & Performance**
   - Queue management
   - Rate limiting
   - Caching layer
   - Background job processing

---

## ✅ SUCCESS METRICS

Project is successful when:
- ✅ User can create contacts
- ✅ User can configure and launch calls
- ✅ Calls execute via Vapi
- ✅ Status updates in real-time
- ✅ Transcripts and summaries display correctly
- ✅ All core features work end-to-end
- ✅ Code is clean and documented
- ✅ README is comprehensive

---

## 📝 NOTES & DECISIONS

### Key Trade-offs
- Simplicity over feature richness
- Speed over perfection
- Core functionality over bonus features
- Working code over comprehensive tests

### Technical Decisions
- Monorepo for easier development
- Supabase for quick DB setup
- Vapi for reliable voice AI
- REST API (not GraphQL) for simplicity
- No auth initially (can add later)

---

**Last Updated**: January 15, 2026
**Status**: Ready to implement
**Estimated Completion**: Same day (8-10 hours)
