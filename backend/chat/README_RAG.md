# 🤖 TalkSense AI - RAG-Powered Chat System

## Overview

This is the **spine of TalkSense AI** - a production-ready Retrieval-Augmented Generation (RAG) system that enables intelligent, context-aware conversations.

### Architecture: Full NLP Pipeline

```
User Input
    ↓
[1] NLU: Hugging Face Embeddings
    ├─ Convert text → semantic vectors
    ├─ Capture meaning (not just keywords)
    └─ Understand intent
    ↓
[2] Search: FAISS Vector Store
    ├─ Semantic search (meaning-based)
    ├─ Find relevant context
    └─ Retrieve top-K similar documents
    ↓
[3] Context Injection
    ├─ Combine retrieved docs
    ├─ Add conversation history
    └─ Build full prompt
    ↓
[4] NLG: Google Gemini
    ├─ Understand context
    ├─ Apply reasoning
    └─ Generate human-like response
    ↓
User sees intelligent conversation
```

---

## 📦 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **NLU** | Hugging Face `sentence-transformers` | Convert text → meaning |
| **Memory** | FAISS | Fast semantic search |
| **LLM** | Google Gemini | Reasoning + response generation |
| **Framework** | Django REST Framework | API structure |
| **DB** | SQLite/PostgreSQL | Chat history, feedback |

---

## 🗂️ Project Structure

```
backend/chat/
├── models.py                    # ChatSession, ChatMessage
├── views.py                     # API endpoints
├── serializers.py               # DRF serializers
├── urls.py                      # URL routing
└── services/                    # AI logic
    ├── embedding_service.py     # Hugging Face integration
    ├── vector_store.py          # FAISS management
    ├── llm_service.py           # Gemini integration
    └── rag_service.py           # RAG orchestration
```

---

## 🚀 API Endpoints

### 1. **Create Chat Session**

```http
POST /api/chat/sessions/
Authorization: Bearer <token>

{
  "title": "Project Planning"  # Optional, auto-generated if empty
}

Response (201):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Project Planning",
  "created_at": "2026-01-05T10:30:00Z",
  "updated_at": "2026-01-05T10:30:00Z",
  "message_count": 0,
  "last_message_preview": null
}
```

### 2. **List User's Chats**

```http
GET /api/chat/sessions/?page=1
Authorization: Bearer <token>

Response (200):
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "550e8400...",
      "title": "Project Planning",
      "created_at": "2026-01-05T10:30:00Z",
      "updated_at": "2026-01-05T10:35:00Z",
      "message_count": 2,
      "last_message_preview": "To implement a chat system..."
    }
  ]
}
```

### 3. **Get Full Chat**

```http
GET /api/chat/sessions/550e8400-e29b-41d4-a716-446655440000/
Authorization: Bearer <token>

Response (200):
{
  "id": "550e8400...",
  "title": "Project Planning",
  "created_at": "2026-01-05T10:30:00Z",
  "updated_at": "2026-01-05T10:35:00Z",
  "messages": [
    {
      "id": "660e8400...",
      "role": "user",
      "content": "How do I implement a chat system?",
      "created_at": "2026-01-05T10:35:00Z",
      "rating": null,
      "tokens_used": null
    },
    {
      "id": "660e8401...",
      "role": "assistant",
      "content": "To implement a chat system, you need several key components...",
      "created_at": "2026-01-05T10:35:05Z",
      "rating": 5,
      "tokens_used": 150
    }
  ]
}
```

### 4. **Send Message (RAG Pipeline)**

```http
POST /api/chat/messages/
Authorization: Bearer <token>

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "How do I implement a chat system?",
  "use_rag": true,           # Enable vector search
  "temperature": 0.7         # 0.0 = deterministic, 1.0 = creative
}

Response (201):
{
  "user_message": {
    "id": "660e8400...",
    "role": "user",
    "content": "How do I implement a chat system?",
    "created_at": "2026-01-05T10:35:00Z",
    "rating": null,
    "tokens_used": null
  },
  "assistant_message": {
    "id": "660e8401...",
    "role": "assistant",
    "content": "To implement a chat system, you need several key components...",
    "created_at": "2026-01-05T10:35:05Z",
    "rating": null,
    "tokens_used": 150
  }
}
```

### 5. **Rate Message**

```http
POST /api/chat/messages/660e8401-e29b-41d4-a716-446655440001/rate/
Authorization: Bearer <token>

{
  "rating": 5  # 1-5 stars
}

Response (200):
{
  "status": "Message rated",
  "rating": 5
}
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# NLP Services
EMBEDDING_MODEL=all-MiniLM-L6-v2
GEMINI_API_KEY=your-gemini-api-key

# Vector Store
FAISS_INDEX_PATH=./faiss_index.bin
FAISS_DOCS_PATH=./faiss_docs.pkl

# Chat Settings
RAG_TOP_K=5              # Number of docs to retrieve
RAG_ENABLED=true         # Enable/disable RAG
```

### Models

**ChatSession**
- `id`: UUID
- `user`: ForeignKey to User
- `title`: str
- `created_at`, `updated_at`: DateTime
- `is_archived`: bool
- `metadata`: JSON

**ChatMessage**
- `id`: UUID
- `session`: ForeignKey to ChatSession
- `role`: 'user' | 'assistant'
- `content`: Text
- `embedding`: Vector (384 dims)
- `rating`: 1-5 (optional)
- `tokens_used`: int
- `metadata`: JSON

---

## 🧠 How the RAG Pipeline Works

### Step-by-Step Flow

1. **User sends message**: "How do I implement a chat system?"

2. **NLU (Hugging Face)**
   - Convert to embedding: `[0.234, -0.156, ..., 0.891]` (384 dimensions)
   - Captures semantic meaning of the query

3. **Semantic Search (FAISS)**
   - Query vector store: "Find docs similar in meaning"
   - Returns top-5 most relevant documents:
     - "Chat architecture basics" (similarity: 0.95)
     - "Real-time messaging" (similarity: 0.87)
     - "Database design for conversations" (similarity: 0.82)
     - ...

4. **Context Injection**
   - Build prompt:
     ```
     Context: [retrieved documents]
     Conversation History: [last 5 messages]
     User Question: How do I implement a chat system?
     ```

5. **NLG (Gemini)**
   - Receives full context
   - Applies reasoning
   - Generates: "To implement a chat system, you need..."

6. **Persist**
   - Save both messages to DB
   - Store embeddings for future retrieval
   - Track tokens used

---

## 📊 Why This Architecture Works

### Problem: Traditional Search is Keyword-Based

```
User: "I forgot my password"
Keyword Search: ❌ Won't find "reset password" docs (different words)

Semantic Search: ✅ Finds docs about account access/authentication
```

### Solution: Semantic Understanding

```
Hugging Face: Understands meaning
FAISS: Searches by meaning
Gemini: Reasons about meaning
```

---

## 🔧 Setup & Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run Migrations

```bash
python manage.py makemigrations chat
python manage.py migrate
```

### 4. Start Server

```bash
python manage.py runserver
```

### 5. Test API

```bash
# Create chat session
curl -X POST http://localhost:8000/api/chat/sessions/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}'

# Send message
curl -X POST http://localhost:8000/api/chat/messages/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "550e8400...",
    "content": "Hello!",
    "use_rag": true
  }'
```

---

## 📈 Analytics & Insights

The system enables powerful analytics:

```python
# Get all ratings for quality metrics
messages = ChatMessage.objects.filter(role='assistant', rating__isnull=False)
avg_rating = messages.aggregate(Avg('rating'))['rating__avg']

# Track token usage for billing
total_tokens = ChatMessage.objects.aggregate(Sum('tokens_used'))

# Find popular topics (NLP on message content)
# Identify struggling users
# A/B test different models
```

---

## 🔐 Security

- ✅ JWT authentication on all endpoints
- ✅ User isolation: Can only access own sessions
- ✅ Content filtering before AI call
- ✅ Rate limiting: 50 messages/hour per user
- ✅ SQLi protection via ORM
- ✅ CORS configuration

---

## 🚀 Future Enhancements

1. **Real-time Chat**: WebSocket support for typing indicators
2. **Streaming Responses**: Token-by-token response streaming
3. **File Upload**: Process PDFs, documents
4. **Knowledge Base Management**: Admin interface for seeding vector store
5. **Export Conversations**: Download chat as PDF/JSON
6. **Advanced Analytics Dashboard**: User insights, trends
7. **Multi-language Support**: Embeddings support 50+ languages
8. **Fine-tuning**: Custom models per domain

---

## 📚 API Documentation

Auto-generated Swagger docs available at:
```
http://localhost:8000/api/docs/
```

---

## 🤝 Contributing

1. Follow Django best practices
2. Write tests for new endpoints
3. Update docs
4. Test RAG pipeline end-to-end

---

## 📝 Notes

- **Embeddings**: 384-dimensional vectors from `all-MiniLM-L6-v2`
- **Vector Store**: FAISS (CPU) - use `faiss-gpu` for faster inference
- **Batch Size**: 32 for embedding generation (tune based on memory)
- **Context Window**: Last 5 messages + top-5 retrieval results
