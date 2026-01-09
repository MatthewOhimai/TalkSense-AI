# TalkSense Expert Knowledge Base

## About the Creator

Hi! I’m **Ohimai Matthew** 👋 — a **backend developer** and **Software Engineer** with a passion for **Python** 🐍 and building scalable, reliable, and secure backend systems. I graduated from **ALX Software Engineering (ALX SE)**, where I developed a strong foundation in real-world software engineering principles.  

I help **startups and small teams** turn ideas and complex business workflows into **production-ready solutions** — from **CRMs and dashboards** to **REST APIs** and **automation tools** — all built with **clean, maintainable code** and modern backend frameworks.  

As a **Computer Educator**, I love breaking down complex tech concepts and helping others unlock their potential in the tech world. I also have hands-on experience in **Web Development**, focusing on building **dynamic, scalable, and user-friendly applications**.  

### 🧩 What I Build
- Custom MVPs & internal business tools  
- RESTful APIs & backend architectures  
- Process automation & integration systems  

### ⚙️ Tech Stack
**Python | Django | Django REST Framework (DRF) | FastAPI | PostgreSQL | MySQL | MongoDB | Git | GitHub | HTML/CSS (for templates)**  

Driven by **problem-solving and impact**, I enjoy creating backends that are not just functional — but **scalable, efficient, and aligned with business goals**. I’m always exploring new challenges and continuously learning to stay ahead in the ever-evolving tech landscape.  

### 📩 Let’s Connect
- **Email:** kingmatthewohimai@gmail.com  
- **GitHub:** [github.com/MatthewOhimai](https://github.com/MatthewOhimai/)  
- **LinkedIn:** [linkedin.com/in/matthew-ohimai](https://www.linkedin.com/in/matthew-ohimai/)  
- **X (Twitter):** [@MatthewOhimai](https://x.com/MatthewOhimai)  

**Bio:** Computer Education Student 📘 | Software Engineer ⚙️ | Django Developer 💻 | Python Enthusiast 🐍 | Building Scalable Solutions with Purpose 🚀

---

## 1. Common Tech Problems & Real Fixes (20)

### 1. JWT Token Keeps Expiring
**Fix:** Implement refresh tokens and auto-refresh on the frontend using interceptors.

### 2. Django CORS Errors
**Fix:** Install `django-cors-headers`, add middleware, and allow frontend origin explicitly.

### 3. Unsupported Media Type (415)
**Fix:** Always send `Content-Type: application/json` for JSON requests.

### 4. Slow API Responses
**Fix:** Add pagination, database indexing, and caching (Redis).

### 5. React App Not Fetching Data
**Fix:** Confirm API base URL, CORS settings, and correct HTTP method.

### 6. OAuth Login Redirect Loop
**Fix:** Ensure callback URL matches exactly in provider settings.

### 7. FAISS Index Empty
**Fix:** Load documents, generate embeddings, and call `index.add()` before search.

### 8. HuggingFace Model Timeout
**Fix:** Cache embeddings locally and preload models at startup.

### 9. Database Migration Conflicts
**Fix:** Reset migrations carefully or squash migrations early.

### 10. N+1 Query Problem
**Fix:** Use `select_related` and `prefetch_related` in Django ORM.

### 11. File Upload Fails
**Fix:** Configure `MEDIA_ROOT`, `MEDIA_URL`, and file permissions.

### 12. CSRF Token Missing
**Fix:** Use CSRF exemption for APIs or send token properly.

### 13. Docker Container Not Starting
**Fix:** Check exposed ports and environment variables.

### 14. API Works Locally but Not in Production
**Fix:** Verify environment variables and DEBUG settings.

### 15. React State Not Updating
**Fix:** Avoid mutating state directly; use state setters.

### 16. Memory Leak in Long-Running Services
**Fix:** Close DB sessions and manage background tasks properly.

### 17. Password Reset Email Not Sending
**Fix:** Configure SMTP credentials and email backend correctly.

### 18. Payment Webhook Not Triggering
**Fix:** Ensure HTTPS endpoint and correct webhook secret.

### 19. Broken Pagination Logic
**Fix:** Always return metadata (count, next, previous).

### 20. Users Getting Logged Out Randomly
**Fix:** Sync token expiry handling between frontend and backend.

---

## 2. Architectural Insights (10)

1. Build **API-first** systems; frontend is just a consumer.
2. Separate **services, schemas, and views** for clarity.
3. Use **RAG (FAISS + LLM)** for accuracy, not raw LLM calls.
4. Design for **stateless authentication** (JWT).
5. Cache aggressively, invalidate intelligently.
6. Logs are more important than comments in production.
7. Environment variables > hardcoded secrets.
8. Start monolithic, refactor to microservices only when needed.
9. Optimize database queries before scaling infrastructure.
10. Developer experience is part of system architecture.

---

## 3. High-Impact Prompt Patterns (10)

### 1. Debugging Prompt
"Act as a senior backend engineer. Diagnose this error and propose a fix."

### 2. Teaching Prompt
"Explain this concept to a beginner using simple analogies."

### 3. Code Review Prompt
"Review this code for security, performance, and best practices."

### 4. RAG Prompt
"Answer strictly using the provided context. If missing, say you don’t know."

### 5. Architecture Prompt
"Propose a scalable architecture for this use case."

### 6. Optimization Prompt
"Refactor this code to improve performance and readability."

### 7. Learning Path Prompt
"Create a step-by-step roadmap based on my current skill level."

### 8. Error Fix Prompt
"Explain why this error occurs and how to prevent it in the future."

### 9. System Prompt
"You are a strict, precise, and practical technical mentor."

### 10. Product Thinking Prompt
"Suggest features that improve user value and monetization."

---

## Final Note

This knowledge base powers **TalkSense AI** to deliver:
- Accurate answers
- Real-world solutions
- Context-aware responses

You are not chatting with a generic AI — you are interacting with **curated expertise**.

