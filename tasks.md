# FieldOps AI - Task Sequenziali

> Ogni task è progettato per essere eseguito da un coding agent.
> Riferimento: `project.md` per dettagli completi.
> Sequenza: Stretta (Task N+1 inizia dopo completamento Task N)

---

## ⚠️ Regole Globali per TUTTI i Task

**IMPORTANTE**: Queste regole si applicano a OGNI task:

1. **Lingua del codice**: Tutto il codice DEVE essere in **inglese**
   - Nomi variabili, funzioni, classi: inglese
   - Commenti: inglese
   - Docstrings: inglese
   - Commit messages: inglese
   - README e docs: inglese

2. **Commit messages**:
   - In inglese
   - **NO firma Claude Code** (no "Generated with Claude Code", no "Co-Authored-By: Claude")
   - Formato: conventional commits (feat:, fix:, docs:, etc.)

3. **Riferimento**: Consultare sempre `project.md` per dettagli implementativi

4. **Type hints**: Usare type hints ovunque (Python e TypeScript)

5. **Error handling**: Gestire sempre gli errori in modo appropriato

---

## Task Template

```
## TASK-XX: [Titolo]

**Obiettivo**: [Cosa deve essere raggiunto]
**Tempo stimato**: [4-8 ore]
**Dipendenze**: [Task precedenti richiesti]

### Contesto
[Informazioni necessarie per capire il task]

### Istruzioni
1. [Step 1]
2. [Step 2]
...

### Output Atteso
- [File/cartelle da creare]
- [Funzionalità implementate]

### Criteri di Accettazione
- [ ] [Criterio 1]
- [ ] [Criterio 2]
...

### Test
[Come verificare che il task è completato correttamente]
```

---

# FASE 1: BACKEND CORE

---

## TASK-01: Setup Repository Backend

**Obiettivo**: Creare la struttura base del progetto FastAPI con tutte le dipendenze.
**Tempo stimato**: 4 ore
**Dipendenze**: Nessuna

### Contesto
Repository: `field-ops-api`
Stack: Python 3.13, FastAPI, SQLAlchemy, uv, Pydantic v2
Vedi `project.md` sezione 3.4 per dettagli tech stack.

### Istruzioni
1. Inizializzare repository Git `field-ops-api`
2. Setup `uv` come package manager
3. Creare struttura cartelle:
   ```
   field-ops-api/
   ├── app/
   │   ├── __init__.py
   │   ├── main.py
   │   ├── config.py
   │   ├── api/
   │   │   ├── __init__.py
   │   │   ├── v1/
   │   │   │   ├── __init__.py
   │   │   │   ├── router.py
   │   │   │   ├── endpoints/
   │   │   │   │   └── __init__.py
   │   │   │   └── schemas/
   │   │   │       └── __init__.py
   │   │   └── webhooks/
   │   │       └── __init__.py
   │   ├── core/
   │   │   ├── __init__.py
   │   │   ├── security.py
   │   │   └── exceptions.py
   │   ├── db/
   │   │   ├── __init__.py
   │   │   ├── base.py
   │   │   └── session.py
   │   ├── models/
   │   │   └── __init__.py
   │   ├── services/
   │   │   └── __init__.py
   │   └── utils/
   │       └── __init__.py
   ├── alembic/
   ├── tests/
   ├── docs/
   ├── .env.example
   ├── .gitignore
   ├── pyproject.toml
   ├── alembic.ini
   └── README.md
   ```
4. Installare dipendenze core:
   - fastapi
   - uvicorn
   - sqlalchemy
   - alembic
   - pydantic
   - pydantic-settings
   - python-dotenv
   - httpx
5. Configurare Ruff per linting/formatting
6. Configurare mypy per type checking
7. Creare `app/main.py` con app FastAPI base + health check endpoint
8. Creare `app/config.py` con Settings class (pydantic-settings)
9. Creare `.env.example` con variabili necessarie
10. Setup Alembic per migrations

### Output Atteso
- Repository `field-ops-api` con struttura completa
- FastAPI app runnable con `uvicorn app.main:app`
- Endpoint `GET /health` funzionante
- Ruff e mypy configurati
- Alembic inizializzato

### Criteri di Accettazione
- [ ] `uv run uvicorn app.main:app` avvia il server senza errori
- [ ] `GET /health` ritorna `{"status": "healthy"}`
- [ ] `uv run ruff check .` passa senza errori
- [ ] `uv run mypy .` passa senza errori
- [ ] Struttura cartelle rispetta lo schema sopra

### Test
```bash
uv run uvicorn app.main:app --reload
curl http://localhost:8000/health
# Deve ritornare: {"status": "healthy"}
```

---

## TASK-02: Setup Database Models e Supabase

**Obiettivo**: Creare tutti i modelli SQLAlchemy e configurare connessione a Supabase Postgres.
**Tempo stimato**: 6 ore
**Dipendenze**: TASK-01

### Contesto
Database: Supabase Postgres (EU region)
ORM: SQLAlchemy 2.0 con type hints
Vedi `project.md` sezione 3.6 per schema completo dei modelli.

### Istruzioni
1. Aggiungere dipendenze:
   - asyncpg (async postgres driver)
   - sqlalchemy[asyncio]
2. Creare `app/db/base.py` con Base class SQLAlchemy
3. Creare `app/db/session.py` con:
   - AsyncEngine configuration
   - AsyncSessionLocal
   - get_db dependency
4. Creare modelli in `app/models/`:
   - `organization.py`: Organization model
   - `phone_number.py`: PhoneNumber model
   - `document.py`: Document model
   - `message.py`: Message model
   - `conversation.py`: ConversationState model
   - `activity.py`: ActivityLog model
5. Creare Enums in `app/models/enums.py`:
   - TierEnum (basic, professional, enterprise)
   - DocumentStatusEnum (uploading, processing, indexed, failed)
   - MessageDirectionEnum (inbound, outbound)
6. Aggiungere relazioni tra modelli (FK, relationships)
7. Creare migration iniziale con Alembic
8. Aggiornare `.env.example` con `DATABASE_URL`
9. Creare script `scripts/init_db.py` per inizializzare DB

### Output Atteso
- Tutti i modelli SQLAlchemy in `app/models/`
- Migration Alembic `001_initial.py`
- Connessione async a Postgres funzionante
- Script per inizializzare database

### Criteri di Accettazione
- [ ] Tutti i modelli definiti secondo schema in project.md
- [ ] `alembic upgrade head` esegue senza errori
- [ ] Relazioni FK definite correttamente
- [ ] Type hints completi su tutti i modelli
- [ ] Enums definiti per tutti i campi con valori limitati

### Test
```bash
# Con DATABASE_URL configurato
alembic upgrade head
# Deve creare tutte le tabelle senza errori

# Verificare tabelle create
psql $DATABASE_URL -c "\dt"
```

---

## TASK-03: Setup Qdrant e Embedding Service

**Obiettivo**: Configurare Qdrant Cloud e creare servizio per embeddings.
**Tempo stimato**: 4 ore
**Dipendenze**: TASK-01

### Contesto
Vector DB: Qdrant Cloud (free tier, 1GB)
Embeddings: OpenAI text-embedding-3-small (1536 dim)
Vedi `project.md` sezione 3.7 per collection schema.

### Istruzioni
1. Aggiungere dipendenze:
   - qdrant-client
   - openai
2. Creare `app/services/embedding.py`:
   - Classe EmbeddingService
   - Metodo `embed_text(text: str) -> list[float]`
   - Metodo `embed_batch(texts: list[str]) -> list[list[float]]`
   - Gestione rate limiting OpenAI
3. Creare `app/services/vector_store.py`:
   - Classe VectorStoreService
   - Metodo `init_collection()` per creare collection se non esiste
   - Metodo `upsert_chunks(org_id, document_id, chunks)`
   - Metodo `search(org_id, query, limit=5)` con filtro per org_id
   - Metodo `delete_document(org_id, document_id)`
4. Creare collection schema:
   ```python
   {
     "collection": "documents",
     "vectors": {"size": 1536, "distance": "Cosine"},
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
5. Aggiornare `.env.example`:
   - `QDRANT_URL`
   - `QDRANT_API_KEY`
   - `OPENAI_API_KEY`
6. Creare script `scripts/init_qdrant.py` per inizializzare collection

### Output Atteso
- EmbeddingService funzionante
- VectorStoreService con CRUD operations
- Collection Qdrant configurata
- Script inizializzazione

### Criteri di Accettazione
- [ ] `embed_text()` ritorna vettore 1536 dimensioni
- [ ] `upsert_chunks()` salva correttamente su Qdrant
- [ ] `search()` filtra per org_id
- [ ] `delete_document()` rimuove tutti i chunk di un documento
- [ ] Gestione errori per rate limiting e connection errors

### Test
```python
# Test manuale
from app.services.embedding import EmbeddingService
from app.services.vector_store import VectorStoreService

emb = EmbeddingService()
vec = emb.embed_text("test query")
assert len(vec) == 1536

vs = VectorStoreService()
vs.init_collection()
# Verificare su Qdrant Cloud dashboard che collection esiste
```

---

## TASK-04: LangChain Agent con Tools

**Obiettivo**: Implementare il ReAct agent con i 4 tools per RAG.
**Tempo stimato**: 8 ore
**Dipendenze**: TASK-03

### Contesto
Framework: LangChain con `create_agent`
LLM: Claude 3.5 Haiku (primary), GPT-4o-mini (fallback 1), Gemini Flash (fallback 2)
Tools: semantic_search, keyword_search, grep_documents, get_document_section
Vedi `project.md` sezione 3.5 per dettagli.

### Istruzioni
1. Aggiungere dipendenze:
   - langchain
   - langchain-anthropic
   - langchain-openai
   - langchain-google-genai
2. Creare `app/services/llm.py`:
   - Factory per LLM con fallback chain
   - Metodo `get_llm()` che ritorna Claude, fallback a GPT, fallback a Gemini
   - Tracking del modello usato per billing
3. Creare `app/services/tools/` directory con:
   - `semantic_search.py`: Tool per ricerca semantica in Qdrant
   - `keyword_search.py`: Tool per ricerca keyword/fuzzy
   - `grep_documents.py`: Tool per regex search nei raw documents
   - `get_document_section.py`: Tool per leggere sezione specifica
4. Creare `app/services/agent.py`:
   - Classe RAGAgent
   - Metodo `create_agent(org_id)` che crea agent con tools filtrati per org
   - Metodo `invoke(query, conversation_history)` che esegue query
   - System prompt che istruisce risposte concise (< 160 char ideale)
   - Timeout 360 secondi
5. Creare `app/services/conversation.py`:
   - Gestione memoria conversazione (ultimi 5 messaggi)
   - Load/save da database (ConversationState model)
6. Aggiornare `.env.example`:
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_API_KEY` (per Gemini)
7. Creare system prompt in `app/prompts/rag_system.py`

### Output Atteso
- RAGAgent funzionante con 4 tools
- Fallback chain LLM
- Conversation memory
- System prompt ottimizzato per risposte brevi

### Criteri di Accettazione
- [ ] Agent risponde a query usando i tools appropriati
- [ ] Fallback funziona se Claude non disponibile
- [ ] Risposte tendono a essere < 160 caratteri
- [ ] Conversation history mantenuta tra chiamate
- [ ] Timeout 360s implementato
- [ ] Tracking modello usato per ogni query

### Test
```python
from app.services.agent import RAGAgent

agent = RAGAgent(org_id="test-org")
response = agent.invoke("Come cambio il filtro olio?", history=[])
print(response)
# Deve usare semantic_search e ritornare risposta concisa
```

---

## TASK-05: Document Processing Pipeline

**Obiettivo**: Implementare upload, estrazione testo, chunking e indexing documenti.
**Tempo stimato**: 8 ore
**Dipendenze**: TASK-02, TASK-03

### Contesto
Formati: PDF, DOCX, TXT, MD, XLSX, CSV, HTML (NO OCR)
Storage: Supabase Storage
Chunking: 1000 char, 15% overlap
Vedi `project.md` sezione 4 per dettagli pipeline.

### Istruzioni
1. Aggiungere dipendenze:
   - supabase
   - pypdf
   - python-docx
   - pandas
   - openpyxl
   - python-slugify
2. Creare `app/services/storage.py`:
   - Classe StorageService (Supabase Storage wrapper)
   - Metodo `upload_file(org_id, document_id, file)`
   - Metodo `delete_file(path)`
   - Metodo `get_file_url(path)`
3. Creare `app/services/document_processor.py`:
   - Classe DocumentProcessor
   - Metodo `validate_file(file, org)` - check tipo, size, limiti tier
   - Metodo `compute_hash(file) -> str` - SHA256
   - Metodo `slugify_filename(filename) -> str`
   - Metodo `extract_text(file_path, file_type) -> str`
   - Metodo `chunk_text(text, chunk_size=1000, overlap=150) -> list[Chunk]`
   - Metodo `process_document(org_id, document_id)` - orchestratore async
4. Creare extractors in `app/services/extractors/`:
   - `pdf_extractor.py`
   - `docx_extractor.py`
   - `text_extractor.py` (txt, md, html)
   - `spreadsheet_extractor.py` (xlsx, csv)
5. Creare `app/api/v1/endpoints/documents.py`:
   - `POST /api/v1/documents/upload`
   - `GET /api/v1/documents`
   - `DELETE /api/v1/documents/{id}`
6. Creare schemas in `app/api/v1/schemas/document.py`
7. Implementare background processing con FastAPI BackgroundTasks
8. Gestire stati documento: uploading → processing → indexed/failed
9. Aggiornare `.env.example`:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

### Output Atteso
- Upload endpoint funzionante
- Estrazione testo per tutti i formati supportati
- Chunking con overlap
- Indexing automatico in Qdrant
- Background processing

### Criteri di Accettazione
- [ ] Upload PDF → estrazione testo → chunking → embedding → Qdrant
- [ ] Duplicate detection via hash SHA256
- [ ] Filename slugificato correttamente
- [ ] Limiti tier enforced (50MB storage per BASIC)
- [ ] Status aggiornato correttamente (processing → indexed/failed)
- [ ] DELETE rimuove file da Storage e chunks da Qdrant

### Test
```bash
# Upload test PDF
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_manual.pdf"

# Verificare status
curl http://localhost:8000/api/v1/documents
# Deve mostrare documento con status "indexed"
```

---

## TASK-06: Twilio SMS Webhook

**Obiettivo**: Implementare webhook per ricezione SMS e invio risposte.
**Tempo stimato**: 6 ore
**Dipendenze**: TASK-04

### Contesto
Twilio: Numero condiviso con routing per caller ID
Encoding: ASCII (GSM-7), multi-SMS se > 160 char
Vedi `project.md` sezione 5 per comportamenti SMS.

### Istruzioni
1. Aggiungere dipendenze:
   - twilio
2. Creare `app/services/sms.py`:
   - Classe SMSService
   - Metodo `send_sms(to, body)` - gestisce multi-SMS se necessario
   - Metodo `split_message(text, max_length=160) -> list[str]`
   - Metodo `sanitize_to_gsm7(text) -> str` - rimuove caratteri non-GSM7
3. Creare `app/api/webhooks/twilio.py`:
   - `POST /webhooks/twilio/sms`
   - Validazione signature Twilio
   - Lookup numero in `phone_numbers` table
   - Se non registrato → ignora silenziosamente (return 200 empty)
   - Se registrato → process in background, return 200 immediato
4. Creare `app/services/sms_handler.py`:
   - Classe SMSHandler
   - Metodo `handle_incoming(from_number, body, org_id)`
   - Gestione messaggi vuoti → risposta errore
   - Invoke RAGAgent
   - Check quota prima di rispondere
   - Append avvisi quota se necessario
   - Invio risposta via SMSService
5. Creare `app/services/quota.py`:
   - Classe QuotaService
   - Metodo `check_quota(org_id) -> QuotaStatus`
   - Metodo `consume_quota(org_id, cost_euro)`
   - Metodo `get_warning_message(quota_status, lang)` - messaggi in lingua
6. Implementare burst protection: max 50 query/ora per org
7. Aggiornare `.env.example`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

### Output Atteso
- Webhook Twilio funzionante
- SMS routing per org
- Risposte multi-SMS
- Quota checking con avvisi
- Burst protection

### Criteri di Accettazione
- [ ] SMS in arrivo → risposta AI in < 360s
- [ ] Numeri non registrati ignorati silenziosamente
- [ ] Messaggi > 160 char splittati correttamente
- [ ] Caratteri non-GSM7 rimossi/sostituiti
- [ ] Avvisi quota aggiunti a 90%, 100%
- [ ] Blocco a 110% con SMS una tantum
- [ ] Burst protection 50/ora funzionante

### Test
```bash
# Simulare webhook Twilio (con ngrok in dev)
curl -X POST http://localhost:8000/webhooks/twilio/sms \
  -d "From=+393331234567" \
  -d "To=+1234567890" \
  -d "Body=Come cambio filtro olio CAT 320?"

# Verificare che SMS risposta inviato
```

---

## TASK-07: Welcome SMS e Conversation Memory

**Obiettivo**: Implementare SMS di benvenuto e persistenza conversazione.
**Tempo stimato**: 4 ore
**Dipendenze**: TASK-06

### Contesto
Welcome SMS inviato quando nuovo numero registrato.
Memory: ultimi 5 messaggi per numero telefono.
Vedi `project.md` sezione 5.3 per testo welcome.

### Istruzioni
1. Creare `app/services/welcome.py`:
   - Metodo `send_welcome_sms(phone_number, lang="en")`
   - Testo multilingua (EN, DE, FR, IT, ES)
   - Include disclaimer breve
2. Aggiornare `app/services/conversation.py`:
   - Metodo `get_history(phone_number) -> list[Message]`
   - Metodo `add_message(phone_number, role, content)`
   - Metodo `clear_old_messages()` - mantieni solo ultimi 5
   - Persistenza su ConversationState table
3. Creare trigger per welcome SMS:
   - Quando nuovo PhoneNumber creato → invia welcome
4. Aggiornare SMS handler per usare conversation history
5. Implementare language detection:
   - Usa lingua del messaggio in arrivo per risposta
   - Messaggi di sistema (errori, quota) nella stessa lingua

### Output Atteso
- Welcome SMS automatico
- Conversation memory persistente
- Risposte multilingua

### Criteri di Accettazione
- [ ] Nuovo numero → riceve welcome SMS automaticamente
- [ ] Welcome SMS in lingua appropriata
- [ ] Conversazione mantiene contesto ultimi 5 messaggi
- [ ] Messaggi sistema tradotti (EN, DE, FR, IT, ES)

### Test
```python
# Test welcome
from app.services.welcome import send_welcome_sms
send_welcome_sms("+393331234567", lang="it")
# Verifica SMS ricevuto con testo italiano
```

---

# FASE 2: FRONTEND

---

## TASK-08: Setup Repository Frontend

**Obiettivo**: Creare struttura base Next.js 14 con App Router.
**Tempo stimato**: 4 ore
**Dipendenze**: Nessuna (può partire in parallelo dopo TASK-01)

### Contesto
Repository: `field-ops-web`
Stack: Next.js 14, TypeScript, Tailwind, Radix UI
Vedi `project.md` sezione 3.3 per dettagli.

### Istruzioni
1. Creare repository `field-ops-web`
2. Inizializzare Next.js 14 con App Router:
   ```bash
   npx create-next-app@latest field-ops-web --typescript --tailwind --eslint --app
   ```
3. Installare dipendenze:
   - @radix-ui/react-* (dialog, dropdown, toast, etc.)
   - @tanstack/react-query
   - react-hook-form
   - @hookform/resolvers
   - zod
   - @supabase/supabase-js
   - @supabase/ssr
   - lucide-react (icons)
   - clsx, tailwind-merge
4. Creare struttura cartelle:
   ```
   field-ops-web/
   ├── app/
   │   ├── (auth)/
   │   │   ├── login/
   │   │   └── signup/
   │   ├── (dashboard)/
   │   │   ├── layout.tsx
   │   │   ├── page.tsx (dashboard)
   │   │   ├── documents/
   │   │   ├── analytics/
   │   │   ├── simulator/
   │   │   ├── billing/
   │   │   ├── settings/
   │   │   └── activity/
   │   ├── layout.tsx
   │   ├── page.tsx (landing)
   │   └── globals.css
   ├── components/
   │   ├── ui/
   │   └── features/
   ├── lib/
   │   ├── supabase/
   │   ├── api/
   │   └── utils/
   ├── hooks/
   ├── types/
   ├── .env.local.example
   └── ...
   ```
5. Configurare Tailwind con design system "industriale"
6. Configurare ESLint + Prettier
7. Setup TypeScript strict mode
8. Creare componenti UI base con Radix:
   - Button
   - Input
   - Card
   - Dialog
   - Toast
9. Creare `lib/utils.ts` con helper `cn()` per classNames

### Output Atteso
- Repository Next.js 14 funzionante
- Struttura App Router con route groups
- Componenti UI base
- Design system Tailwind configurato

### Criteri di Accettazione
- [ ] `npm run dev` avvia senza errori
- [ ] `npm run build` compila senza errori
- [ ] `npm run lint` passa
- [ ] Struttura cartelle rispetta schema
- [ ] Componenti UI base funzionanti

### Test
```bash
npm run dev
# Navigare a http://localhost:3000
# Deve mostrare pagina base
```

---

## TASK-09: Autenticazione Supabase

**Obiettivo**: Implementare auth flow con Supabase (email + Google SSO).
**Tempo stimato**: 6 ore
**Dipendenze**: TASK-08

### Contesto
Auth: Supabase Auth con Email+Password e Google SSO
Session: 30 giorni, sessioni illimitate
Vedi `project.md` sezione 3.6 e 6.1.

### Istruzioni
1. Creare `lib/supabase/client.ts` - browser client
2. Creare `lib/supabase/server.ts` - server client per RSC
3. Creare `lib/supabase/middleware.ts` - session refresh
4. Creare middleware Next.js per proteggere routes dashboard
5. Implementare pagine auth:
   - `app/(auth)/login/page.tsx` - form login
   - `app/(auth)/signup/page.tsx` - form registrazione
   - `app/(auth)/callback/route.ts` - OAuth callback
6. Creare form components:
   - LoginForm con email/password + Google button
   - SignupForm con validazione (8+ char, mixed case, number)
7. Creare hooks:
   - `useUser()` - current user
   - `useSession()` - session info
8. Implementare logout
9. Aggiornare `.env.local.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Output Atteso
- Login/Signup pages funzionanti
- Google SSO funzionante
- Session persistence 30 giorni
- Protected routes

### Criteri di Accettazione
- [ ] Signup crea utente e organizzazione
- [ ] Login funziona con email/password
- [ ] Google SSO funziona
- [ ] Routes dashboard protette (redirect a login)
- [ ] Logout funziona
- [ ] Password validation (8+, mixed case, number)

### Test
```
1. Navigare a /signup
2. Creare account con email
3. Verificare email
4. Login
5. Verificare accesso a /dashboard
6. Logout
7. Verificare redirect a /login
```

---

## TASK-10: Dashboard Layout e Overview

**Obiettivo**: Creare layout dashboard con sidebar e pagina overview.
**Tempo stimato**: 6 ore
**Dipendenze**: TASK-09

### Contesto
Layout: Sidebar + main content area
Overview: Quota %, messaggi recenti, status documenti
Solo Light Mode.

### Istruzioni
1. Creare `app/(dashboard)/layout.tsx`:
   - Sidebar con navigation
   - Header con user menu
   - Main content area
2. Creare componenti layout:
   - `components/features/Sidebar.tsx`
   - `components/features/Header.tsx`
   - `components/features/UserMenu.tsx`
3. Sidebar navigation items:
   - Dashboard (overview)
   - Documents
   - Analytics
   - Chat Simulator
   - Activity
   - Settings
   - Billing
4. Creare `app/(dashboard)/page.tsx` (overview):
   - QuotaCard: percentuale quota usata con progress bar
   - RecentMessagesCard: ultimi 5 messaggi (solo count, no contenuto)
   - DocumentsStatusCard: documenti per status
   - QuickStats: query oggi, success rate
5. Creare API client in `lib/api/client.ts`:
   - Wrapper per chiamate a FastAPI backend
   - Gestione auth header
   - Error handling
6. Setup React Query provider

### Output Atteso
- Layout dashboard responsive
- Sidebar navigation
- Overview page con widgets
- API client configurato

### Criteri di Accettazione
- [ ] Layout responsive (mobile: hamburger menu)
- [ ] Sidebar evidenzia pagina corrente
- [ ] Overview mostra dati reali da API
- [ ] Quota progress bar funzionante
- [ ] User menu con logout

### Test
```
1. Login
2. Verificare layout dashboard
3. Verificare widgets mostrano dati
4. Navigare tra pagine via sidebar
5. Test responsive (resize browser)
```

---

## TASK-11: Documents Page

**Obiettivo**: Implementare pagina gestione documenti con upload drag & drop.
**Tempo stimato**: 8 ore
**Dipendenze**: TASK-10, TASK-05

### Contesto
Upload: Drag & drop, validazione client-side
Lista: Status indicizzazione, delete con conferma
Popup per file duplicati: "Sostituire o mantenere?"

### Istruzioni
1. Creare `app/(dashboard)/documents/page.tsx`
2. Creare componenti:
   - `DocumentUploader.tsx`: Drag & drop area
   - `DocumentList.tsx`: Lista documenti con status
   - `DocumentCard.tsx`: Singolo documento
   - `DeleteConfirmDialog.tsx`: Conferma eliminazione
   - `DuplicateDialog.tsx`: Scelta sostituire/mantenere
3. Implementare upload:
   - Drag & drop con react-dropzone
   - Validazione client: tipo file, size
   - Progress bar upload
   - Status polling durante processing
4. Implementare lista:
   - Fetch documenti da API
   - Badge status (uploading, processing, indexed, failed)
   - Delete con conferma UI
5. Gestire duplicate:
   - Se hash già esiste, mostrare dialog
   - Opzioni: Sostituisci / Mantieni entrambi
6. Mostrare errori upload/processing
7. Aggiungere a Activity Feed quando documento caricato/eliminato

### Output Atteso
- Upload drag & drop funzionante
- Lista documenti con status real-time
- Delete con conferma
- Gestione duplicati

### Criteri di Accettazione
- [ ] Drag & drop file funziona
- [ ] Validazione tipo file client-side
- [ ] Progress bar durante upload
- [ ] Status aggiornato durante processing
- [ ] Delete con dialog conferma
- [ ] Duplicate detection con dialog scelta
- [ ] Badge status colorati (verde=indexed, giallo=processing, rosso=failed)

### Test
```
1. Drag & drop PDF
2. Verificare upload e processing
3. Verificare status diventa "indexed"
4. Provare upload stesso file → dialog duplicato
5. Delete documento → conferma → verificare rimosso
```

---

## TASK-12: Analytics Page

**Obiettivo**: Implementare dashboard analytics con grafici e metriche.
**Tempo stimato**: 6 ore
**Dipendenze**: TASK-10

### Contesto
Metriche: Query count, quota, top docs, query frequenti, success rate, trend
Export: CSV
Vedi `project.md` sezione 6.1.

### Istruzioni
1. Aggiungere dipendenza: recharts (grafici)
2. Creare `app/(dashboard)/analytics/page.tsx`
3. Creare API endpoint backend `GET /api/v1/analytics`:
   - Query count (questo mese)
   - Quota usage %
   - Top 5 documenti consultati
   - Top 10 query frequenti (aggregate, no PII)
   - Success rate (%)
   - Trend giornaliero ultimo mese
4. Creare componenti:
   - `QueryCountCard.tsx`
   - `QuotaUsageCard.tsx`
   - `TopDocumentsCard.tsx`
   - `FrequentQueriesCard.tsx`
   - `SuccessRateCard.tsx`
   - `TrendChart.tsx` (line chart con recharts)
5. Implementare date range selector (last 7d, 30d, 90d)
6. Implementare export CSV:
   - Button "Export CSV"
   - Download file con dati analytics

### Output Atteso
- Dashboard analytics completa
- Grafici interattivi
- Export CSV funzionante

### Criteri di Accettazione
- [ ] Tutte le metriche visualizzate
- [ ] Trend chart con dati reali
- [ ] Date range selector funzionante
- [ ] Export CSV scarica file corretto
- [ ] Responsive layout

### Test
```
1. Navigare a /analytics
2. Verificare tutte le card mostrano dati
3. Cambiare date range
4. Click Export CSV
5. Verificare file scaricato contiene dati corretti
```

---

## TASK-13: Chat Simulator

**Obiettivo**: Implementare chat di test per provare AI senza SMS.
**Tempo stimato**: 6 ore
**Dipendenze**: TASK-10, TASK-04

### Contesto
Simulatore: 10 msg/giorno free, poi consuma quota LLM
Interfaccia: Chat-like, mostra risposta AI
Vedi `project.md` sezione 3.3.

### Istruzioni
1. Creare API endpoint backend `POST /api/v1/chat/simulate`:
   - Accetta `message` nel body
   - Check limite 10/giorno (counter in Redis o DB)
   - Se > 10, consuma quota LLM
   - Invoca RAGAgent
   - Ritorna risposta
2. Creare `app/(dashboard)/simulator/page.tsx`
3. Creare componenti:
   - `ChatContainer.tsx`: Container principale
   - `MessageList.tsx`: Lista messaggi
   - `MessageBubble.tsx`: Singolo messaggio (user/ai)
   - `ChatInput.tsx`: Input con send button
4. Implementare:
   - Invio messaggio → loading state → risposta
   - Scroll automatico a ultimo messaggio
   - Counter messaggi gratuiti rimanenti
   - Warning quando > 10 msg "Consumerà quota"
5. Mostrare metadata risposta:
   - Tools usati
   - Tempo risposta
   - Modello usato

### Output Atteso
- Chat simulator funzionante
- Counter messaggi free
- Metadata risposta visibili

### Criteri di Accettazione
- [ ] Invio messaggio → risposta AI
- [ ] Loading state durante attesa
- [ ] Counter "X messaggi gratuiti rimanenti"
- [ ] Warning dopo 10 messaggi
- [ ] Metadata visibili (tools, tempo, modello)
- [ ] Scroll automatico

### Test
```
1. Navigare a /simulator
2. Inviare messaggio "Come cambio filtro olio?"
3. Verificare risposta AI
4. Verificare counter decrementato
5. Inviare 10+ messaggi, verificare warning quota
```

---

## TASK-14: Activity Feed

**Obiettivo**: Implementare feed attività con storico eventi.
**Tempo stimato**: 4 ore
**Dipendenze**: TASK-10

### Contesto
Eventi: doc_uploaded, doc_deleted, doc_failed, quota_warning, subscription_change, login
Vedi `project.md` sezione 6.3.

### Istruzioni
1. Creare API endpoint backend `GET /api/v1/activity`:
   - Lista eventi da ActivityLog table
   - Paginazione (limit, offset)
   - Filtro per tipo evento (opzionale)
2. Creare `app/(dashboard)/activity/page.tsx`
3. Creare componenti:
   - `ActivityList.tsx`: Lista eventi con infinite scroll
   - `ActivityItem.tsx`: Singolo evento con icon e timestamp
   - `ActivityFilter.tsx`: Filtro per tipo
4. Design eventi:
   - Icon diversa per tipo
   - Timestamp relativo ("2 ore fa")
   - Descrizione evento

### Output Atteso
- Activity feed con storico
- Infinite scroll
- Filtri per tipo

### Criteri di Accettazione
- [ ] Lista eventi ordinata per data desc
- [ ] Infinite scroll carica più eventi
- [ ] Filtro per tipo funzionante
- [ ] Timestamp relativi
- [ ] Icon appropriate per tipo evento

### Test
```
1. Navigare a /activity
2. Verificare eventi mostrati
3. Scroll down → carica più eventi
4. Filtrare per tipo
```

---

## TASK-15: Settings Page

**Obiettivo**: Implementare pagina impostazioni account.
**Tempo stimato**: 4 ore
**Dipendenze**: TASK-10

### Contesto
Settings: Profilo, cambio password, gestione numeri telefono, delete account
Delete: Immediato con conferma UI.

### Istruzioni
1. Creare `app/(dashboard)/settings/page.tsx`
2. Creare sezioni:
   - **Profile**: Nome, email (readonly)
   - **Password**: Cambio password
   - **Phone Numbers**: Lista numeri, aggiungi/rimuovi (solo per Enterprise)
   - **Danger Zone**: Delete account
3. Creare componenti:
   - `ProfileSection.tsx`
   - `PasswordSection.tsx`
   - `PhoneNumbersSection.tsx`
   - `DangerZone.tsx`
4. Implementare:
   - Update profilo
   - Cambio password con validazione
   - Aggiungi numero (validazione E.164)
   - Rimuovi numero (solo admin può, conferma UI)
   - Delete account (conferma UI, chiama API delete)
5. Nascondere PhoneNumbersSection se non Enterprise

### Output Atteso
- Settings page completa
- Gestione numeri per Enterprise
- Delete account funzionante

### Criteri di Accettazione
- [ ] Update profilo funziona
- [ ] Cambio password con validazione
- [ ] Numeri telefono: add/remove (Enterprise only)
- [ ] Delete account con conferma
- [ ] Sezioni appropriate per tier

### Test
```
1. Navigare a /settings
2. Modificare profilo
3. Cambiare password
4. (Se Enterprise) Aggiungere numero telefono
5. Verificare validazione E.164
```

---

## TASK-16: Billing Page e Stripe Integration

**Obiettivo**: Implementare pagina billing con Stripe Customer Portal.
**Tempo stimato**: 6 ore
**Dipendenze**: TASK-10

### Contesto
Stripe: Customer Portal per gestione abbonamento
Upgrade/Downgrade: Immediato con prorata
Vedi `project.md` sezione 2 per pricing.

### Istruzioni
1. Creare API endpoints backend:
   - `POST /api/v1/billing/create-checkout-session` - per nuovi abbonamenti
   - `POST /api/v1/billing/create-portal-session` - per gestione esistente
   - `POST /webhooks/stripe` - webhook Stripe
2. Aggiungere dipendenza backend: stripe
3. Creare `app/(dashboard)/billing/page.tsx`
4. Creare componenti:
   - `CurrentPlanCard.tsx`: Piano attuale, quota, prossimo rinnovo
   - `PlansComparison.tsx`: Tabella comparativa tier
   - `PaymentMethodCard.tsx`: Metodo pagamento attuale
   - `BillingHistoryCard.tsx`: Ultime fatture
5. Implementare:
   - Redirect a Stripe Checkout per nuovo abbonamento
   - Redirect a Customer Portal per gestione
   - Mostrare piano corrente e limiti
   - Mostrare prossimo rinnovo e importo
6. Aggiornare `.env` con Stripe keys

### Output Atteso
- Billing page completa
- Stripe integration funzionante
- Upgrade/downgrade via Customer Portal

### Criteri di Accettazione
- [ ] Piano corrente mostrato correttamente
- [ ] Click "Manage Subscription" → Stripe Portal
- [ ] Upgrade/downgrade funziona
- [ ] Webhook aggiorna subscription in DB
- [ ] Fatture visibili

### Test
```
1. Navigare a /billing
2. Verificare piano corrente
3. Click "Manage Subscription"
4. Verificare redirect a Stripe Portal
5. (Sandbox) Upgrade piano
6. Verificare aggiornamento in dashboard
```

---

## TASK-17: Changelog In-App

**Obiettivo**: Implementare modal "What's New" per changelog.
**Tempo stimato**: 2 ore
**Dipendenze**: TASK-10

### Contesto
Changelog: Modal che appare quando ci sono nuove feature
Dismiss: Utente può chiudere, non riappare fino a nuovo update

### Istruzioni
1. Creare file `data/changelog.json`:
   ```json
   {
     "version": "1.0.0",
     "date": "2025-01-XX",
     "changes": [
       {"type": "feature", "text": "Initial release"},
       {"type": "feature", "text": "Document upload and indexing"},
       {"type": "feature", "text": "SMS-based AI assistant"}
     ]
   }
   ```
2. Creare componenti:
   - `ChangelogModal.tsx`: Modal con lista changes
   - `ChangelogProvider.tsx`: Context per gestire visualizzazione
3. Implementare:
   - Salva ultima versione vista in localStorage
   - Mostra modal se versione changelog > versione vista
   - Dismiss salva versione corrente
4. Integrare in dashboard layout

### Output Atteso
- Modal changelog funzionante
- Persistence dismiss in localStorage

### Criteri di Accettazione
- [ ] Modal appare per nuove versioni
- [ ] Dismiss salva preferenza
- [ ] Non riappare dopo dismiss
- [ ] Design coerente con UI

### Test
```
1. Clear localStorage
2. Navigare a dashboard
3. Verificare modal appare
4. Dismiss modal
5. Refresh → modal non appare
```

---

# FASE 3: INTEGRAZIONI E DEPLOY

---

## TASK-18: Quota System Completo

**Obiettivo**: Implementare sistema quota completo con tracking e notifiche.
**Tempo stimato**: 6 ore
**Dipendenze**: TASK-06, TASK-07

### Contesto
Quota: Token-based, tracking per query
Burst: Max 50/ora
Notifiche: 90%, 100%, 110%
Reset: Mezzanotte billing day

### Istruzioni
1. Completare `app/services/quota.py`:
   - Metodo `track_usage(org_id, tokens_in, tokens_out, model)`
   - Metodo `calculate_cost(tokens_in, tokens_out, model) -> Decimal`
   - Metodo `check_burst_limit(org_id) -> bool` (50/ora)
   - Metodo `should_notify(org_id, threshold) -> bool`
   - Metodo `reset_quota(org_id)` - chiamato da cron
2. Creare tabella `quota_notifications`:
   - Traccia quali notifiche già inviate (90%, 100%, 110%)
   - Reset quando quota reset
3. Creare scheduled job per reset quota:
   - Ogni giorno a mezzanotte, check org con billing_day = oggi
   - Reset quota_used_euro a 0
   - Clear quota_notifications
4. Integrare quota check in SMS handler:
   - Prima di processare, check burst limit
   - Prima di rispondere, check quota
   - Append warning se 90%/100%
   - Block + SMS una tantum se 110%
5. Creare endpoint `GET /api/v1/quota` per frontend

### Output Atteso
- Quota tracking completo
- Burst protection funzionante
- Reset automatico
- Notifiche quota

### Criteri di Accettazione
- [ ] Ogni query traccia tokens e costo
- [ ] Burst limit 50/ora enforced
- [ ] Notifiche 90%, 100% aggiunte a SMS
- [ ] Blocco a 110% con SMS una tantum
- [ ] Reset giornaliero per billing day

### Test
```python
# Simulare consumo quota
for i in range(100):
    quota_service.track_usage(org_id, 1000, 500, "haiku")

# Verificare notifiche e blocco
```

---

## TASK-19: Data Export GDPR

**Obiettivo**: Implementare export dati utente in JSON.
**Tempo stimato**: 4 ore
**Dipendenze**: TASK-02

### Contesto
GDPR: Right to access, export in JSON
Include: Profilo, documenti metadata, analytics aggregate

### Istruzioni
1. Creare `app/services/data_export.py`:
   - Metodo `export_user_data(org_id) -> dict`
   - Raccoglie: Organization, PhoneNumbers, Documents (metadata), ActivityLog
   - NO contenuto messaggi (privacy, già deleted dopo 30gg)
   - NO contenuto documenti (troppo grande)
2. Creare endpoint `POST /api/v1/settings/export-data`:
   - Genera JSON
   - Ritorna file download
3. Integrare in Settings page:
   - Button "Export My Data"
   - Download JSON

### Output Atteso
- Export dati funzionante
- JSON con tutti i dati utente

### Criteri di Accettazione
- [ ] Export include tutti i dati richiesti
- [ ] File JSON valido
- [ ] Download funziona
- [ ] No PII di altri utenti incluso

### Test
```
1. Navigare a /settings
2. Click "Export My Data"
3. Verificare download JSON
4. Verificare contenuto JSON corretto
```

---

## TASK-20: Landing Page

**Obiettivo**: Creare landing page minimal con pricing.
**Tempo stimato**: 6 ore
**Dipendenze**: TASK-08

### Contesto
Design: Minimal, 1 pagina
Sezioni: Hero, How it works, Pricing, FAQ, CTA
Vedi `project.md` sezione 10.2.

### Istruzioni
1. Creare `app/page.tsx` (landing)
2. Creare sezioni:
   - **Hero**: Headline, subheadline, CTA button, demo GIF/video
   - **How It Works**: 3 step (Upload manuali → Manda SMS → Ricevi risposta)
   - **Pricing**: Tabella comparativa 3 tier
   - **FAQ**: Accordion con domande comuni
   - **Final CTA**: "Inizia ora - 14 giorni soddisfatti o rimborsati"
3. Creare componenti:
   - `HeroSection.tsx`
   - `HowItWorksSection.tsx`
   - `PricingSection.tsx`
   - `FAQSection.tsx`
   - `CTASection.tsx`
4. Design responsive
5. Link CTA → /signup
6. Footer con link Privacy, Terms, Contact

### Output Atteso
- Landing page completa
- Responsive design
- Pricing table

### Criteri di Accettazione
- [ ] Hero con value proposition chiara
- [ ] How it works in 3 step
- [ ] Pricing table con tutti i tier
- [ ] FAQ funzionante (accordion)
- [ ] CTA linkato a signup
- [ ] Mobile responsive

### Test
```
1. Navigare a /
2. Verificare tutte le sezioni
3. Test responsive (mobile)
4. Click CTA → redirect a /signup
```

---

## TASK-21: Legal Pages

**Obiettivo**: Creare pagine Privacy Policy e Terms of Service.
**Tempo stimato**: 2 ore
**Dipendenze**: TASK-08

### Contesto
Legal: Template modificati per FieldOps AI
Contenuto: Da template standard + personalizzazioni

### Istruzioni
1. Creare `app/privacy/page.tsx`
2. Creare `app/terms/page.tsx`
3. Usare template legali e personalizzare:
   - Nome azienda/prodotto
   - Tipo servizio (AI, SMS)
   - Data processing (Supabase, OpenAI, Anthropic, Twilio)
   - Disclaimer AI
4. Layout minimal, leggibile
5. Link da footer landing e dashboard

### Output Atteso
- Privacy Policy page
- Terms of Service page

### Criteri di Accettazione
- [ ] Privacy Policy presente e personalizzata
- [ ] Terms of Service presenti e personalizzati
- [ ] Link funzionanti da footer
- [ ] Disclaimer AI incluso

### Test
```
1. Navigare a /privacy
2. Verificare contenuto
3. Navigare a /terms
4. Verificare contenuto
```

---

## TASK-22: Deploy Backend (Render)

**Obiettivo**: Deploy FastAPI backend su Render.
**Tempo stimato**: 4 ore
**Dipendenze**: TASK-01 a TASK-07 completati

### Contesto
Platform: Render free tier
URL: api.fieldops.ai

### Istruzioni
1. Creare `Dockerfile` per backend:
   ```dockerfile
   FROM python:3.13-slim
   WORKDIR /app
   COPY . .
   RUN pip install uv && uv sync
   CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```
2. Creare `render.yaml`:
   ```yaml
   services:
     - type: web
       name: field-ops-api
       env: docker
       plan: free
       envVars:
         - key: DATABASE_URL
           sync: false
         # ... altre env vars
   ```
3. Connettere repo a Render
4. Configurare environment variables
5. Configurare custom domain api.fieldops.ai
6. Verificare health check
7. Configurare Twilio webhook URL

### Output Atteso
- Backend deployato su Render
- API accessibile
- Webhook Twilio configurato

### Criteri di Accettazione
- [ ] API raggiungibile su api.fieldops.ai
- [ ] Health check passa
- [ ] Env vars configurate
- [ ] Twilio webhook funzionante

### Test
```bash
curl https://api.fieldops.ai/health
# Deve ritornare {"status": "healthy"}
```

---

## TASK-23: Deploy Frontend (Vercel)

**Obiettivo**: Deploy Next.js frontend su Vercel.
**Tempo stimato**: 4 ore
**Dipendenze**: TASK-08 a TASK-21 completati

### Contesto
Platform: Vercel free tier
URLs: fieldops.ai (landing), app.fieldops.ai (dashboard)

### Istruzioni
1. Connettere repo `field-ops-web` a Vercel
2. Configurare environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (https://api.fieldops.ai)
3. Configurare domini:
   - fieldops.ai → landing
   - app.fieldops.ai → dashboard
4. Configurare redirects in `next.config.js` se necessario
5. Verificare build e deploy
6. Testare tutte le pagine

### Output Atteso
- Frontend deployato su Vercel
- Domini configurati
- Tutto funzionante

### Criteri di Accettazione
- [ ] Landing su fieldops.ai
- [ ] Dashboard su app.fieldops.ai
- [ ] Auth funzionante
- [ ] API calls funzionanti
- [ ] Responsive su mobile

### Test
```
1. Navigare a fieldops.ai
2. Click signup
3. Creare account
4. Upload documento
5. Test chat simulator
6. Verificare tutto funziona end-to-end
```

---

## TASK-24: Testing End-to-End e Go Live

**Obiettivo**: Test completo del sistema e go live.
**Tempo stimato**: 8 ore
**Dipendenze**: TASK-22, TASK-23

### Contesto
Test: Flusso completo signup → upload → SMS → risposta
Checklist: Tutto funzionante prima di aprire al pubblico

### Istruzioni
1. Creare checklist test E2E:
   - [ ] Signup nuovo utente
   - [ ] Email verification
   - [ ] Stripe checkout (sandbox)
   - [ ] Upload documento PDF
   - [ ] Verifica indicizzazione
   - [ ] Invia SMS test
   - [ ] Verifica risposta AI
   - [ ] Chat simulator
   - [ ] Analytics popolate
   - [ ] Activity feed
   - [ ] Billing page
   - [ ] Export data
   - [ ] Delete account
2. Testare con PDF manuale reale (Caterpillar, Komatsu)
3. Testare multi-SMS (risposta > 160 char)
4. Testare fallback LLM (simulare Anthropic down)
5. Testare quota warning e blocco
6. Verificare Welcome SMS
7. Fix eventuali bug trovati
8. Attivare Stripe live mode
9. Configurare email support@fieldops.ai
10. Go live!

### Output Atteso
- Sistema testato end-to-end
- Bug critici fixati
- Pronto per utenti reali

### Criteri di Accettazione
- [ ] Tutti i test E2E passano
- [ ] No errori critici in console
- [ ] Performance accettabile (< 30s risposta SMS)
- [ ] Stripe in live mode
- [ ] Monitoraggio attivo

### Test
```
Eseguire tutti i test della checklist manualmente
Documentare eventuali problemi
Fix e re-test
```

---

# RIEPILOGO TASK

| Task | Titolo | Ore | Dipendenze |
|------|--------|-----|------------|
| 01 | Setup Repository Backend | 4 | - |
| 02 | Setup Database Models e Supabase | 6 | 01 |
| 03 | Setup Qdrant e Embedding Service | 4 | 01 |
| 04 | LangChain Agent con Tools | 8 | 03 |
| 05 | Document Processing Pipeline | 8 | 02, 03 |
| 06 | Twilio SMS Webhook | 6 | 04 |
| 07 | Welcome SMS e Conversation Memory | 4 | 06 |
| 08 | Setup Repository Frontend | 4 | - |
| 09 | Autenticazione Supabase | 6 | 08 |
| 10 | Dashboard Layout e Overview | 6 | 09 |
| 11 | Documents Page | 8 | 10, 05 |
| 12 | Analytics Page | 6 | 10 |
| 13 | Chat Simulator | 6 | 10, 04 |
| 14 | Activity Feed | 4 | 10 |
| 15 | Settings Page | 4 | 10 |
| 16 | Billing Page e Stripe Integration | 6 | 10 |
| 17 | Changelog In-App | 2 | 10 |
| 18 | Quota System Completo | 6 | 06, 07 |
| 19 | Data Export GDPR | 4 | 02 |
| 20 | Landing Page | 6 | 08 |
| 21 | Legal Pages | 2 | 08 |
| 22 | Deploy Backend | 4 | 01-07 |
| 23 | Deploy Frontend | 4 | 08-21 |
| 24 | Testing E2E e Go Live | 8 | 22, 23 |

**Totale: ~120 ore (~3 settimane full-time)**

---

# DIAGRAMMA DIPENDENZE

```
TASK-01 (Backend Setup)
    ├── TASK-02 (Database) ──┬── TASK-05 (Doc Processing) ──┐
    │                        │                               │
    ├── TASK-03 (Qdrant) ────┤                               │
    │                        │                               │
    └── TASK-04 (Agent) ─────┴── TASK-06 (Twilio) ──── TASK-07 (Welcome/Memory)
                                      │                       │
                                      └── TASK-18 (Quota) ────┘

TASK-08 (Frontend Setup)
    ├── TASK-09 (Auth) ──── TASK-10 (Dashboard) ──┬── TASK-11 (Documents)
    │                                              ├── TASK-12 (Analytics)
    │                                              ├── TASK-13 (Simulator)
    │                                              ├── TASK-14 (Activity)
    │                                              ├── TASK-15 (Settings)
    │                                              ├── TASK-16 (Billing)
    │                                              └── TASK-17 (Changelog)
    │
    ├── TASK-19 (Export) ─────────────────────────────┐
    ├── TASK-20 (Landing) ────────────────────────────┤
    └── TASK-21 (Legal) ──────────────────────────────┘
                                                      │
TASK-22 (Deploy BE) ──────────────────────────────────┤
                                                      │
TASK-23 (Deploy FE) ──────────────────────────────────┤
                                                      │
                                                      └── TASK-24 (E2E + Go Live)
```

---

*File generato automaticamente. Aggiornare se cambiano requisiti.*
