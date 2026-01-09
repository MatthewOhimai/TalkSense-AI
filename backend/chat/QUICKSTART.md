# 🚀 Quick Start Guide - TalkSense AI Chat System

## 5-Minute Setup

### 1. Install Packages
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Then edit `.env` and add your API keys:
```
GEMINI_API_KEY=your-gemini-api-key-here
EMBEDDING_MODEL=all-MiniLM-L6-v2
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

### 5. Test It!
```bash
# 1. Get JWT token (login)
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "your_password"}'

# Response: {"access": "token...", "refresh": "token..."}

# 2. Create chat session
export TOKEN="token..."
curl -X POST http://localhost:8000/api/chat/sessions/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Chat"}'

# Response: {"id": "550e8400...", "title": "My First Chat", ...}

# 3. Send message (RAG pipeline executes!)
export SESSION_ID="550e8400..."
curl -X POST http://localhost:8000/api/chat/messages/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'"$SESSION_ID"'",
    "content": "What is machine learning?",
    "use_rag": true
  }'

# Response: {
#   "user_message": {...},
#   "assistant_message": {
#     "content": "Machine learning is...",
#     "tokens_used": 150
#   }
# }

# 4. Get chat history
curl -X GET http://localhost:8000/api/chat/sessions/$SESSION_ID/ \
  -H "Authorization: Bearer $TOKEN"

# 5. Rate the response
curl -X POST http://localhost:8000/api/chat/messages/message-id/rate/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
```

---

## 🧠 What Just Happened?

When you sent the message:

1. **Hugging Face**: Converted "What is machine learning?" to a 384-dimensional vector
2. **FAISS**: Searched vector store for similar documents (if seeded)
3. **Context**: Retrieved most relevant docs + conversation history
4. **Gemini**: Generated intelligent response using retrieved context
5. **Saved**: Message and embedding stored in database

---

## 🎯 Next Steps

1. **Seed Vector Store**
   ```python
   from chat.services.rag_service import RAGService
   
   service = RAGService()
   docs = [
       {"id": "1", "text": "How to reset password", "metadata": {}},
       {"id": "2", "text": "How to upgrade account", "metadata": {}},
   ]
   service.seed_vector_store(docs)
   ```

2. **View API Docs**
   ```
   http://localhost:8000/api/docs/
   ```

3. **Check Database**
   ```bash
   python manage.py shell
   >>> from chat.models import ChatSession
   >>> ChatSession.objects.all()
   ```

4. **Monitor Vector Store**
   ```python
   from chat.services.vector_store import VectorStore
   store = VectorStore()
   print(store.get_stats())
   # Output: {'total_documents': 5, 'index_size': 5, 'dimension': 384}
   ```

---

## 🔥 API Endpoints Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat/sessions/` | Create new chat |
| GET | `/api/chat/sessions/` | List chats |
| GET | `/api/chat/sessions/{id}/` | Get full chat |
| POST | `/api/chat/messages/` | Send message (RAG) |
| POST | `/api/chat/messages/{id}/rate/` | Rate response |

---

## ❓ Troubleshooting

### Embedding Model Not Found
```
Error: "No sentence-transformers model called ..."
```
**Solution**: Model downloads on first use. Check internet connection.

### FAISS Index Error
```
Error: "Failed to load FAISS index"
```
**Solution**: Happens on first run. Creates new index automatically.

### Gemini API Error
```
Error: "403 - invalid API key"
```
**Solution**: Check `GEMINI_API_KEY` in `.env` file

### Permission Denied on Chat
```
Error: "Session not found"
```
**Solution**: Only see chats you created. Check session ID.

---

## 📝 Architecture Quick View

```
┌──────────────────────────┐
│   User sends message     │
└────────────┬─────────────┘
             │
    ┌────────▼─────────┐
    │ Hugging Face     │  ← Convert to vector
    │ Embeddings       │
    └────────┬─────────┘
             │
    ┌────────▼─────────┐
    │ FAISS Search     │  ← Find similar docs
    └────────┬─────────┘
             │
    ┌────────▼─────────┐
    │ Gemini LLM       │  ← Generate response
    └────────┬─────────┘
             │
    ┌────────▼─────────┐
    │ Save to DB       │  ← Persist history
    └────────┬─────────┘
             │
    User sees answer ✨
```

---

## 🎓 Learning Resources

- **Embeddings**: [Hugging Face Docs](https://huggingface.co/docs/sentence-transformers)
- **FAISS**: [Facebook AI Similarity Search](https://github.com/facebookresearch/faiss)
- **Gemini**: [Google AI Studio](https://ai.google.dev/)
- **RAG Pattern**: [LangChain RAG](https://python.langchain.com/docs/use_cases/question_answering/)

---

Good luck! 🚀
