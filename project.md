# FieldOps AI - Project Ground Truth

> Versione: 3.0
> Ultimo aggiornamento: 2025-01-XX
> Status: Pre-Development

---

## 1. Vision & Positioning

**One-liner**: AI assistant via SMS per tecnici sul campo nel settore Heavy Machinery & Mining.

**Problema**: I tecnici in cantiere/miniera hanno manuali da 500+ pagine, connessione internet instabile, e devono risolvere problemi in fretta. Oggi usano WhatsApp + PDF sul telefono = lento e frustrante.

**Soluzione**: Mandi un SMS con la domanda, l'AI cerca nei tuoi manuali e risponde. Funziona ovunque ci sia segnale GSM.

**Mercato target**: Europa (EU).

**Settore verticale**: Heavy Machinery & Mining (escavatori, pale, trivelle, impianti di frantumazione, etc.)

**Brand**: FieldOps AI
**Dominio**: Da registrare (fieldops.ai preferito)

---

## 2. Business Model & Pricing

Posizionamento: Strumento professionale "No-Brainer" per aziende con alti costi operativi.
**Nessun Free Tier**. Garanzia "Soddisfatti o Rimborsati" 14 giorni.
**Prezzi pubblici** sulla landing page.

### Tier Structure

| Tier | Nome | Prezzo Mensile | Prezzo Annuale (-8%) | Target |
|------|------|----------------|----------------------|--------|
| 1 | **BASIC** | €79/mese | €72/mese (€869/anno) | Freelance |
| 2 | **PROFESSIONAL** | €149/mese | €137/mese (€1,643/anno) | Ingegneri Senior, Capi Cantiere |
| 3 | **ENTERPRISE** | €399/mese | €367/mese (€4,399/anno) | Team / Aziende |

### Limiti per Tier

| Risorsa | BASIC | PROFESSIONAL | ENTERPRISE |
|---------|-------|--------------|------------|
| Numeri telefono | 1 | 1 | 5 |
| Storage documenti | 50 MB | Illimitato | Illimitato |
| SMS | Illimitati | Illimitati | Illimitati |
| Quota LLM | €15/mese | €35/mese | €80/mese |
| Analytics | Full | Full | Full |
| Support | Email + Docs | Email + Docs | Email + Docs |

### Sistema Quota (Token-Based)

L'utente vede una **percentuale** semplice. Dietro il cofano calcoliamo i **costi reali in token** per ogni modello LLM usato.

**Logica**:
```
quota_usata_euro = sum(costo_per_query)
costo_per_query = (input_tokens * prezzo_input) + (output_tokens * prezzo_output)
percentuale_mostrata = (quota_usata_euro / quota_totale_euro) * 100
```

**Burst Protection**: Max 50 query/ora per evitare spike.

**Notifiche quota**:
- **90%**: Primo avviso via SMS ("Hai usato il 90% della tua quota mensile")
- **100%**: Secondo avviso via SMS ("Quota esaurita. Upgrade o attendi reset.")
- **110%**: Blocco servizio + SMS una tantum (poi silenzio)

**Reset**: Mezzanotte del giorno di billing (data sottoscrizione).

**Fallback LLM**: Se usiamo GPT-4o-mini o Gemini Flash invece di Haiku, addebitiamo il **costo reale** del modello usato.

### Pagamenti

- **Metodi**: Carta di credito + PayPal (via Stripe)
- **Trial**: Nessuno. Solo 14 giorni soddisfatti o rimborsati.
- **Failed payment**: Grace period 7 giorni, 3 retry automatici, poi sospensione
- **Upgrade/Downgrade**: Immediato con prorata

---

## 3. Technical Architecture

### 3.1 Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                      │
│           App Router • Radix UI • React Query • Zod             │
│                  Deploy: Vercel (free tier)                     │
│                     URL: app.fieldops.ai                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Python 3.13)              │
│         SQLAlchemy ORM • Alembic • uv • Pydantic v2             │
│                    Deploy: Render (free tier)                   │
│                     API: api.fieldops.ai                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Supabase │ │  Qdrant  │ │  Twilio  │
              │ Postgres │ │  Cloud   │ │   SMS    │
              │  + Auth  │ │ VectorDB │ │ Gateway  │
              │  + Store │ │ (free)   │ │          │
              │  (free)  │ │          │ │          │
              └──────────┘ └──────────┘ └──────────┘
                                 │
                                 ▼
              ┌─────────────────────────────────────┐
              │       AI ENGINE (LangChain)         │
              │                                     │
              │  ReAct Agent (create_agent)         │
              │  4 Tools: semantic, keyword,        │
              │           grep, get_section         │
              │                                     │
              │  LLM: Claude 3.5 Haiku              │
              │  Fallback: GPT-4o-mini → Gemini     │
              │  Embeddings: OpenAI text-embed-3-sm │
              └─────────────────────────────────────┘
```

### 3.2 Repository Structure

**Due repository separate**:
- `field-ops-api` - Backend FastAPI
- `field-ops-web` - Frontend Next.js

### 3.3 Frontend (Next.js 14 + App Router)

**URL**: `app.fieldops.ai`

**Tech Stack**:
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Radix UI + Tailwind CSS (custom styling)
- React Query + Context (state management)
- React Hook Form + Zod (forms)
- Supabase Auth SDK

**Code Quality**:
- ESLint + Prettier
- TypeScript strict mode
- Naming: camelCase (variables/functions), PascalCase (components)

**Language**: ALL code in **English**
- Variable names, functions, components: English
- Comments: English
- Commit messages: English (conventional commits, NO Claude Code signature)

**Pagine MVP**:

| Pagina | Descrizione | Priority |
|--------|-------------|----------|
| **Dashboard** | Overview quota %, messaggi recenti, status documenti | P0 |
| **Documents** | Upload drag & drop, stato indicizzazione, delete | P0 |
| **Analytics** | Query frequenti, success rate, trend, top docs, export CSV | P0 |
| **Chat Simulator** | Test AI senza SMS (10 msg/giorno free, poi quota) | P0 |
| **Billing** | Stripe Customer Portal | P0 |
| **Settings** | Account, preferenze | P0 |
| **Activity Feed** | Storico notifiche/eventi | P0 |
| **Team** | Gestione numeri (solo Enterprise) | P1 (v1.1) |

**UI/UX**:
- Solo Light Mode (no dark mode)
- Changelog in-app ("What's new" modal)
- No preview documento prima upload
- Conferma azioni critiche via UI popup (no email)

### 3.4 Backend (FastAPI + Python 3.13)

**URL**: `api.fieldops.ai`

**Tech Stack**:
- Python 3.13
- FastAPI
- SQLAlchemy + Alembic (migrations)
- uv (dependency management)
- Pydantic v2

**Code Quality**:
- Ruff (linting + formatting)
- mypy (type checking)
- Naming: snake_case (Python), camelCase (TypeScript)

**Language**: ALL code in **English**
- Variable names, functions, classes: English
- Comments and docstrings: English
- Commit messages: English (conventional commits format)
- README and documentation: English

**Git Commits**:
- Format: Conventional Commits (feat:, fix:, docs:, chore:, etc.)
- Language: English
- **NO Claude Code signature** (no "Generated with Claude Code", no "Co-Authored-By: Claude")

**API Design**:
- Versioned: `/api/v1/...`
- Response format: `{"data": {...}, "meta": {...}}`
- Errors: RFC 7807 Problem Details

**Endpoints principali**:

```
# Auth (delegato a Supabase Auth)
POST /api/v1/auth/callback         # OAuth callback

# Documents
POST /api/v1/documents/upload      # Upload file
GET  /api/v1/documents             # Lista documenti utente
DELETE /api/v1/documents/{id}      # Elimina documento

# Quota & Analytics
GET  /api/v1/quota                 # Stato quota corrente
GET  /api/v1/analytics             # Full analytics

# Chat
POST /api/v1/chat/simulate         # Chat simulator

# Webhooks
POST /webhooks/twilio/sms          # Riceve SMS da Twilio
POST /webhooks/stripe              # Stripe events
```

### 3.5 AI Engine (LangChain ReAct Agent)

**Framework**: LangChain `create_agent` (versione recente).

**LLM Stack**:

| Priority | Model | Cost (per 1M tokens) |
|----------|-------|----------------------|
| Primary | Claude 3.5 Haiku | $0.25 in / $1.25 out |
| Fallback 1 | GPT-4o-mini | $0.15 in / $0.60 out |
| Fallback 2 | Gemini Flash | $0.075 in / $0.30 out |

**Max Iterations**: Default LangChain.

**Timeout**: 360 secondi (6 minuti) prima di considerare fallito.

**Agent Tools** (4 separati):

| Tool | Descrizione | Esempio Query |
|------|-------------|---------------|
| `semantic_search` | Ricerca per significato nel vector store | "come sostituire filtro olio" |
| `keyword_search` | Ricerca esatta/fuzzy per codici, numeri | "errore E-4021" |
| `grep_documents` | Ricerca regex nei documenti raw | Pattern specifici, numeri serie |
| `get_document_section` | Legge sezione specifica di un documento | "capitolo 4.2 del manuale CAT 320" |

**Conversation Memory**: Ultimi 5 messaggi per contesto multi-turno.

**Response Behavior**:
- Prompt istruisce LLM a dare risposte **concise** (< 160 char ideale)
- Se risposta > 160 char → multi-SMS automatico
- Forza encoding **ASCII (GSM-7)** per economizzare (160 char/SMS)
- No emoji nelle risposte

**Fallback Message**: "Info non trovata. Prova a riformulare o contatta supporto tecnico."

### 3.6 Database (Supabase Postgres + SQLAlchemy)

**Provider**: Supabase (free tier, EU region)

**Auth**: Supabase Auth
- Email + Password
- Google SSO (OAuth)
- Password: min 8 char + mixed case + number
- Session timeout: 30 giorni
- Concurrent sessions: illimitate

**ORM**: SQLAlchemy con Alembic migrations.

**Schema** (SQLAlchemy models):

```python
class Organization(Base):
    __tablename__ = "organizations"

    id: UUID
    name: str
    tier: Enum["basic", "professional", "enterprise"]
    quota_limit_euro: Decimal
    quota_used_euro: Decimal
    storage_limit_mb: int | None  # NULL = unlimited
    storage_used_mb: int
    stripe_customer_id: str
    stripe_subscription_id: str
    billing_day: int  # Day of month for reset
    created_at: datetime

class PhoneNumber(Base):
    __tablename__ = "phone_numbers"

    id: UUID
    org_id: UUID  # FK
    phone_number: str  # E.164 format
    is_active: bool
    added_by_user_id: UUID
    created_at: datetime

class Document(Base):
    __tablename__ = "documents"

    id: UUID
    org_id: UUID  # FK
    filename: str  # Slugified, max 255 char
    original_filename: str
    file_hash: str  # SHA256 for duplicate detection
    file_size_bytes: int
    file_type: str
    storage_path: str
    status: Enum["uploading", "processing", "indexed", "failed"]
    page_count: int
    chunk_count: int
    created_at: datetime
    replaced_by_id: UUID | None

class Message(Base):
    __tablename__ = "messages"

    id: UUID
    org_id: UUID  # FK
    phone_from: str
    phone_to: str
    direction: Enum["inbound", "outbound"]
    body: str
    tokens_input: int
    tokens_output: int
    cost_euro: Decimal
    model_used: str  # "haiku", "gpt4o-mini", "gemini-flash"
    tools_used: list[str]
    success: bool
    created_at: datetime

class ConversationState(Base):
    __tablename__ = "conversation_state"

    thread_id: str  # phone_number
    org_id: UUID
    messages: list[dict]  # Last 5 messages
    updated_at: datetime

class ActivityLog(Base):
    __tablename__ = "activity_log"

    id: UUID
    org_id: UUID
    user_id: UUID | None
    event_type: str  # "doc_uploaded", "doc_deleted", "quota_warning", etc.
    event_data: dict
    created_at: datetime
```

**Data Retention**: 30 giorni per messages, poi auto-delete.

### 3.7 Vector Store (Qdrant Cloud)

**Provider**: Qdrant Cloud (free tier, 1GB)

**Embedding Model**: OpenAI `text-embedding-3-small`
- 1536 dimensioni
- $0.02 / 1M tokens

**Collection Schema**:
```json
{
  "collection": "documents",
  "vectors": { "size": 1536, "distance": "Cosine" },
  "payload_schema": {
    "org_id": "keyword",
    "document_id": "keyword",
    "chunk_index": "integer",
    "page_number": "integer",
    "section_title": "text",
    "content_raw": "text"
  }
}
```

### 3.8 File Storage (Supabase Storage)

**Provider**: Supabase Storage (incluso nel free tier)

**Structure**:
```
/documents/{org_id}/{document_id}/{filename}
```

---

## 4. Document Processing Pipeline

### 4.1 Formati Supportati

Tutti i formati **testuali**:
- PDF (solo con testo, **NO OCR**)
- DOCX, DOC
- TXT, MD
- XLSX, CSV
- HTML

### 4.2 Limiti

| Limite | BASIC | PROFESSIONAL | ENTERPRISE |
|--------|-------|--------------|------------|
| Storage totale | 50 MB | Illimitato | Illimitato |
| Dimensione singolo file | 50 MB | 100 MB | 100 MB |
| Pagine per PDF | 1000 | 2000 | 2000 |
| Filename max | 255 char | 255 char | 255 char |

### 4.3 Processing Flow

```
Upload → Validate → Hash Check → Store → Extract → Chunk → Embed → Index
   │         │          │          │        │         │        │       │
   │         │          │          │        │         │        │       └→ Qdrant
   │         │          │          │        │         │        └→ OpenAI
   │         │          │          │        │         └→ 1000 char, 15% overlap
   │         │          │          │        └→ pypdf / python-docx / pandas
   │         │          │          └→ Supabase Storage
   │         │          └→ Blocca se hash già esiste
   │         └→ Type, size, tier limits
   └→ Slug filename (es. "Manuale Catàlogo.pdf" → "manuale-catalogo.pdf")
```

**Chunking**: 1000 char, 150 char overlap (15%).

**Duplicate Detection**: SHA256 hash del file. Se già esiste, blocca upload.

### 4.4 Document Update Policy

Quando l'utente carica un file con stesso nome:
1. **Popup chiede**: "Sostituire il documento esistente o mantenere entrambi?"
2. Se sostituisce: vecchio marcato come `replaced_by_id`, chunks rimossi da Qdrant
3. Se mantiene: nuovo documento con suffix (`-2`, `-3`, etc.)

### 4.5 Processing Failure

Se il processing fallisce:
- **Badge rosso** in dashboard con status "failed"
- Nessuna email notifica
- Utente può ritentare o eliminare

---

## 5. SMS & Twilio

### 5.1 Numero Condiviso con Routing

- **Un unico numero Twilio** per tutti i clienti
- Routing basato su caller ID (numero mittente)
- Lookup in `phone_numbers` table per trovare org
- Se numero non registrato → **ignora silenziosamente** (no risposta, no costo)

### 5.2 Phone Number Validation

- Solo validazione formato **E.164** (es. +393331234567)
- Nessun OTP/verifica via SMS

### 5.3 Welcome SMS

Quando un nuovo numero viene registrato:
```
Benvenuto in FieldOps AI! Scrivi una domanda per iniziare.
Es: "Come cambio filtro olio CAT 320?"
Disclaimer: risposte AI, verifica sempre.
```

### 5.4 SMS Behavior

| Scenario | Comportamento |
|----------|---------------|
| Messaggio vuoto/spazi | "Messaggio vuoto ricevuto. Riprova con una domanda." |
| Multi-part inbound (>160 char) | Concatena automaticamente |
| Risposta > 160 char | Multi-SMS automatico |
| Encoding | Forza ASCII (GSM-7), 160 char/SMS |
| Timeout AI (360s) | "Timeout. Riprova tra qualche minuto." |
| Quota 90% | Avviso in coda alla risposta |
| Quota 100% | Avviso in coda alla risposta |
| Quota 110%+ | SMS una tantum, poi silenzio |

### 5.5 No Special Commands

Tutto passa all'AI. Nessun comando speciale (HELP, STOP, STATUS).

**Opt-out/STOP**: Gestito automaticamente da Twilio.

### 5.6 Lingue Supportate

Auto-detect dalla query. Risposte in:
- Inglese (EN)
- Tedesco (DE)
- Francese (FR)
- Italiano (IT)
- Spagnolo (ES)

Messaggi di sistema seguono la lingua della query.

---

## 6. Analytics

### 6.1 User Dashboard (Full per tutti i tier)

| Metrica | Descrizione |
|---------|-------------|
| Query count | Messaggi totali questo mese |
| Quota usage | % quota LLM usata |
| Top documents | Documenti più consultati |
| Query frequenti | Domande più fatte (aggregate) |
| Success rate | % risposte trovate vs fallback |
| Trend temporali | Grafico usage nel tempo |
| Export CSV | Download dati analytics |

**Privacy**: Solo analytics aggregate. Singoli messaggi SMS **non visibili** in dashboard.

### 6.2 Cost Tracking (per query)

Ogni messaggio logga:
- `tokens_input`, `tokens_output`
- `cost_euro` (calcolato dal modello usato)
- `model_used` (haiku, gpt4o-mini, gemini-flash)
- `tools_used`
- `success`

### 6.3 Activity Feed

Lista eventi in-app:
- Document uploaded/deleted/failed
- Quota warnings
- Subscription changes
- Login events

---

## 7. Legal & Compliance

### 7.1 Disclaimer

```
DISCLAIMER: FieldOps AI fornisce risposte generate da intelligenza
artificiale basate sui documenti caricati. Le risposte non sostituiscono
il giudizio professionale. L'utente è responsabile della verifica delle
informazioni prima dell'applicazione operativa. FieldOps AI declina
ogni responsabilità per danni derivanti dall'uso delle risposte fornite.
```

Mostrato in: Welcome SMS, Footer dashboard, Terms of Service.

### 7.2 GDPR Compliance

- Data residency: EU (Supabase EU, Qdrant EU)
- Right to deletion: **Delete immediato** (no grace period)
- Data export: **JSON** format
- Logging retention: **30 giorni**
- No IP logging (privacy first)
- No admin impersonation

### 7.3 Legal Pages

- Privacy Policy: Template + modifica
- Terms of Service: Template + modifica

### 7.4 Invoicing

Stripe gestisce tutto:
- Stripe Tax per IVA EU
- Stripe Invoicing automatico
- Customer Portal per fatture

---

## 8. Infrastructure & DevOps

### 8.1 Hosting (Budget: < €50/mese)

| Service | Provider | Tier | Cost |
|---------|----------|------|------|
| Backend | Render | Free | €0 |
| Frontend | Vercel | Free | €0 |
| Database | Supabase | Free | €0 |
| Vector DB | Qdrant Cloud | Free (1GB) | €0 |
| Auth | Supabase Auth | Free | €0 |
| Storage | Supabase Storage | Free | €0 |
| SMS | Twilio | Pay-as-you-go | ~€0.07/msg |
| LLM | Anthropic | Pay-as-you-go | Variable |
| Embeddings | OpenAI | Pay-as-you-go | $0.02/1M tok |

### 8.2 Environments

- **Dev**: Locale
- **Prod**: Render + Vercel

No staging environment per MVP.

### 8.3 CI/CD

- **Deploy**: Manuale (push to main → manual trigger)
- **Git Strategy**: Trunk-based (tutto su main)
- **Branching**: Feature branches → PR → merge to main

### 8.4 Monitoring

- **Logs**: Render built-in logs
- **Error Alerts**: Email (manual setup)
- **No Sentry** per MVP

### 8.5 Documentation

- `/docs` folder in ogni repo
- README.md con setup instructions

---

## 9. Support & Onboarding

### 9.1 Support

- **Docs/FAQ**: Knowledge base self-service
- **Email**: support@fieldops.ai
- No chat live, no telefono

### 9.2 Onboarding (100% Self-service)

1. Signup su `app.fieldops.ai`
2. Email verification
3. Stripe Checkout (carta o PayPal)
4. Dashboard → Upload primi manuali
5. Riceve SMS con numero Twilio da usare
6. Test con Chat Simulator (10 msg/giorno free)

---

## 10. Go-to-Market

### 10.1 Acquisition

**Canale**: Paid Ads (Google Ads, LinkedIn Ads)

**Targeting**:
- Job titles: Field Engineer, Maintenance Manager, Site Supervisor
- Industries: Mining, Construction, Heavy Equipment
- Geo: EU (DE, UK, FR, IT, ES)

### 10.2 Landing Page

**Minimal**: 1 pagina con:
- Hero section con value prop
- Demo video/GIF
- Pricing table
- CTA: "Inizia ora - 14 giorni soddisfatti o rimborsati"
- FAQ

### 10.3 Beta Testing

- Cerca manuali pubblici (CAT, Komatsu, Volvo) per test
- Outreach via LinkedIn/cold email
- No contatti esistenti nel settore

---

## 11. Development Roadmap

### Week 1: Core Backend + AI Engine

- [ ] Setup `field-ops-api` repo (FastAPI + uv + SQLAlchemy)
- [ ] Supabase setup (Postgres + Auth + Storage)
- [ ] Qdrant Cloud setup
- [ ] Twilio account setup
- [ ] LangChain agent con 4 tools
- [ ] Webhook endpoint SMS
- [ ] Test: SMS "errore E404" → risposta da PDF

### Week 2: Document Processing + Frontend

- [ ] Setup `field-ops-web` repo (Next.js 14 + App Router)
- [ ] File upload + validation + Supabase Storage
- [ ] Text extraction (pypdf, python-docx, pandas)
- [ ] Chunking + embedding + Qdrant indexing
- [ ] Supabase Auth integration
- [ ] Dashboard + Documents pages

### Week 3: Quota + Billing + Analytics

- [ ] Token counting (tiktoken)
- [ ] Quota tracking + burst protection (50/h)
- [ ] Stripe integration (Checkout, Portal, Webhooks)
- [ ] Tier enforcement
- [ ] Analytics page
- [ ] Chat Simulator (10 free/day)

### Week 4: Polish + Deploy

- [ ] Activity Feed
- [ ] Settings page
- [ ] Multi-SMS handling
- [ ] Welcome SMS
- [ ] Billing page
- [ ] Deploy: Render + Vercel
- [ ] Landing page (minimal)
- [ ] Docs/FAQ

---

## 12. Cost Projections

### Per-User Monthly Costs

**Assumptions**:
- SMS cost: €0.07/msg
- Haiku: ~€0.0013/query
- Usage: BASIC ~150 msg, PRO ~400 msg, ENTERPRISE ~1200 msg

| Component | BASIC (€79) | PROFESSIONAL (€149) | ENTERPRISE (€399) |
|-----------|-------------|---------------------|-------------------|
| LLM quota | €15 | €35 | €80 |
| SMS (est.) | €10.50 | €28 | €84 |
| Infra | ~€0 | ~€0 | ~€0 |
| **Total cost** | ~€25 | ~€63 | ~€164 |
| **Gross margin** | €54 (68%) | €86 (58%) | €235 (59%) |

---

## 13. Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Activation rate | % che manda primo SMS entro 7 giorni | > 70% |
| Query success rate | % risposte trovate vs fallback | > 85% |
| Quota utilization | % quota usata in media | 50-80% |
| Churn rate | % cancellazioni mensili | < 5% |
| LTV/CAC | Lifetime value / acquisition cost | > 3 |

---

## 14. Future Roadmap (Post-MVP)

| Feature | Priority | Version |
|---------|----------|---------|
| Team Management (Enterprise) | Alta | v1.1 |
| MMS con Vision (foto errori) | Alta | v2 |
| OCR per PDF scansionati | Media | v2 |
| Response caching (semantic) | Media | v2 |
| Outbound webhooks | Bassa | v2 |
| Voice support (Twilio Voice) | Bassa | v3 |
| API pubblica | Bassa | v3 |
| White-label | Bassa | v3 |

---

## 15. Tech Debt Accepted (v1)

- [ ] No real-time indexing status (polling)
- [ ] No document versioning UI
- [ ] No team roles/permissions
- [ ] No audit log dettagliato
- [ ] No multi-language UI (solo EN)
- [ ] No response caching
- [ ] No OCR
- [ ] No staging environment
- [ ] No Sentry/APM
- [ ] No automated tests
- [ ] No dark mode

---

## 16. Accounts & Services Checklist

| Service | Status | Action Required |
|---------|--------|-----------------|
| Dominio (fieldops.ai) | ❌ | Registrare |
| Supabase | ❌ | Creare progetto EU |
| Qdrant Cloud | ❌ | Creare cluster EU |
| Twilio | ❌ | Creare account, comprare numero IT/EU |
| Stripe | ✅ | Account attivo |
| OpenAI | ✅ | Account con crediti |
| Anthropic | ✅ | Account attivo |
| Render | ❌ | Creare account |
| Vercel | ❌ | Creare account |
| GitHub | ✅ | Creare repo |

---

*Documento vivente. Aggiornare ad ogni decisione significativa.*
