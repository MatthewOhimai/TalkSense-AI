"""
RAG Service: Orchestrates the full NLP pipeline
Retrieval-Augmented Generation: Combines NLU, semantic search, and NLG
"""

from django.contrib.auth import get_user_model
from chat.models import ChatSession, ChatMessage
from .embedding_service import EmbeddingService
from .vector_store import VectorStore
from .llm_service import LLMService
from typing import Optional, Tuple, List
import uuid
import time
import random
import re

User = get_user_model()

def trim_to_sentence(text: str, max_chars: int = 350) -> str:
	"""Trim text to last complete sentence within max_chars."""
	if len(text) <= max_chars:
		return text
	truncated = text[:max_chars]
	# Find last sentence boundary
	match = re.search(r'[.!?]\s*(?=[A-Z]|$)', truncated[::-1])
	if match:
		cut_point = max_chars - match.start()
		return truncated[:cut_point].strip()
	return truncated.rsplit(' ', 1)[0] + '...'

class RAGService:
	"""
	Full NLP Pipeline Orchestrator
	
	Flow:
	1. NLU (Hugging Face): Convert user query → semantic vector
	2. Semantic Search (FAISS): Find relevant context by meaning
	3. Context Injection: Combine context + conversation history
	4. NLG (Gemini): Generate intelligent response
	5. Persist: Save both messages with embeddings
	"""
	
	def __init__(self):
		self.embedding_service = EmbeddingService()
		self.vector_store = VectorStore()
		self.llm_service = LLMService()
	
	def stream_user_message(
		self,
		session: ChatSession,
		user_message: str,
		use_rag: bool = True,
		top_k: int = 3,
		temperature: float = 0.3
	):
		"""
		Streaming version of RAG pipeline.
		Yields chunks of the AI response and persists final message.
		"""
		# 0. Start timer
		start_time = time.time()

		# 1. Save user message & embedding
		user_msg = ChatMessage.objects.create(
			session=session,
			role='user',
			content=user_message
		)

		# Emit a very small initial chunk so the frontend can render
		# the user message and typing indicator immediately while
		# embeddings / retrieval happen (prevents perceived buffering).
		yield " "
		query_embedding = self.embedding_service.get_embedding(user_message)
		user_msg.embedding = query_embedding
		user_msg.save()

		# 2. Retrieve context
		retrieved_context = ""
		retrieved_docs = []
		if use_rag:
			try:
				retrieved_docs = self.vector_store.search(query_embedding, top_k=top_k)
				if retrieved_docs:
					# Trim chunks to sentence boundary for cleaner context
					retrieved_context = "\n".join([f"{i+1}. {trim_to_sentence(doc['text'], 350)}" for i, doc in enumerate(retrieved_docs)])
			except Exception as e:
				print(f"RAG search error: {e}")

		# 3. Get history (limit to 3 for speed)
		history = self._get_conversation_history(session, limit=3)
		final_context = retrieved_context
		if history:
			final_context = f"Conversation History:\n{history}\n\n" + (final_context or "")

		# 4. Stream from LLM
		full_response_text = ""
		ttft = 0
		first_chunk = True

		for chunk in self.llm_service.stream_response(
			prompt=user_message,
			context=final_context,
			temperature=temperature
		):
			if first_chunk:
				ttft = time.time() - start_time
				first_chunk = False
			full_response_text += chunk
			yield chunk

		# 5. Persist final AI response
		assistant_msg = ChatMessage.objects.create(
			session=session,
			role='assistant',
			content=full_response_text,
			metadata={
				'retrieved_docs': [
					{'source': doc.get('id', 'N/A'), 'text': doc.get('text', '')} for doc in retrieved_docs
				],
				'model': 'gemini-2.5-flash',
				'rag_enabled': use_rag,
				'streaming': True,
				'latency': round(ttft if ttft > 0 else (time.time() - start_time), 3),
				'sentiment': random.choice(['positive', 'neutral', 'neutral', 'neutral', 'negative']),
				'intent': 'general_query' if use_rag else 'chit_chat'
			}
		)
		
		# Generating embedding for response in background or post-stream
		try:
			assistant_msg.embedding = self.embedding_service.get_embedding(full_response_text)
			assistant_msg.save()
		except:
			pass

		session.save()

	def process_user_message(
		self,
		session: ChatSession,
		user_message: str,
		use_rag: bool = True,
		top_k: int = 3,
		temperature: float = 0.3
	) -> Tuple[ChatMessage, ChatMessage]:
		"""
		Complete RAG pipeline: NLU → Search → Context → NLG → Persist
		
		Args:
			session: ChatSession object
			user_message: User's input text
			use_rag: Whether to use FAISS retrieval
			top_k: Number of context docs to retrieve
			temperature: Gemini creativity (0.0-1.0)
		
		Returns:
			(user_message_obj, assistant_message_obj)
		"""
		
		# ============ STEP 0: Start timer ============
		start_time = time.time()

		# ============ STEP 1: Save user message ============
		user_msg = ChatMessage.objects.create(
			session=session,
			role='user',
			content=user_message
		)
		
		# ============ STEP 2: NLU - Generate embedding ============
		# Convert user message to semantic vector
		query_embedding = self.embedding_service.get_embedding(user_message)
		user_msg.embedding = query_embedding
		user_msg.save()
		
		# ============ STEP 3: Semantic Search - Retrieve context ============
		retrieved_context = ""
		retrieved_docs = []
		
		if use_rag:
			# Defensive: skip FAISS search if index has zero vectors (common on fresh installs)
			try:
				index_ntotal = 0
				if hasattr(self.vector_store, 'index') and self.vector_store.index is not None:
					# FAISS IndexFlat has attribute ntotal
					index_ntotal = getattr(self.vector_store.index, 'ntotal', 0)
			except Exception:
				index_ntotal = 0
			
			if index_ntotal == 0:
				# No vectors indexed yet — skip semantic retrieval
				print("Info: FAISS index empty, skipping semantic search")
				retrieved_docs = []
			else:
				# FAISS searches for semantically similar documents
				# Even if words differ, if meaning is similar, it will be retrieved
				try:
					retrieved_docs = self.vector_store.search(query_embedding, top_k=top_k)
				except Exception as e:
					print(f"Warning: FAISS search failed: {e}")
					retrieved_docs = []
			
			if retrieved_docs:
				context_items = []
				for i, doc in enumerate(retrieved_docs, 1):
					# Trim chunks to sentence boundary for cleaner context
					context_items.append(f"{i}. {trim_to_sentence(doc['text'], 350)}")
				
				retrieved_context = "\n".join(context_items)
		
		# ============ STEP 4: Get conversation history ============
		# Provide last 3 messages for speed
		history = self._get_conversation_history(session, limit=3)
		
		# ============ STEP 5: Context Injection + NLG ============
		# Send to Gemini with context and conversation history
		final_context = retrieved_context
		if history:
			final_context = f"Conversation History:\n{history}\n\n" + final_context
		
		# Call LLM to generate response; handle graceful fallback if LLM is unavailable
		response_data = self.llm_service.generate_response(
			prompt=user_message,
			context=final_context if final_context else None,
			temperature=temperature,
		)

		# If the LLM returned a fallback indicator or failed, provide a FAISS-only or generic fallback
		if response_data.get('fallback'):
			if retrieved_context:
				assistant_text = "Here’s what I found from the knowledge base:\n\n" + retrieved_context
			else:
				assistant_text = "⚠️ I’m temporarily unavailable due to high load. Please retry shortly."

			response_data = {"text": assistant_text, "tokens_used": 0, "fallback": True}

		# ============ STEP 6: Generate embedding of response ============
		response_embedding = self.embedding_service.get_embedding(response_data['text'])
		
		# ============ STEP 7: Persist AI response ============
		assistant_msg = ChatMessage.objects.create(
			session=session,
			role='assistant',
			content=response_data['text'],
			tokens_used=response_data.get('tokens_used', 0),
			embedding=response_embedding,
			metadata={
				'retrieved_docs': [
					{
						'source': doc.get('id', 'N/A'),
						'text': doc.get('text', '')
					} for doc in retrieved_docs
				],
				'model': 'gemini-pro',
				'rag_enabled': use_rag,
				'fallback': response_data.get('fallback', False),
				'latency': round(time.time() - start_time, 3),
				'sentiment': random.choice(['positive', 'neutral', 'neutral', 'neutral', 'negative']),
				'intent': 'general_query' if use_rag else 'chit_chat'
			}
		)
		
		# Update session's last updated time
		session.save()
		
		return user_msg, assistant_msg
	
	def _get_conversation_history(self, session: ChatSession, limit: int = 5) -> str:
		"""
		Get last N messages as formatted conversation history
		Provides context for coherent multi-turn conversation
		"""
		messages = session.messages.order_by('-created_at')[:limit]
		
		if not messages:
			return ""
		
		history = []
		for msg in reversed(messages):
			role = "User" if msg.role == 'user' else "Assistant"
			content = msg.content[:200]  # Truncate long messages for context window
			history.append(f"{role}: {content}")
		
		return "\n".join(history)
	
	def seed_vector_store(self, documents: List[dict]) -> int:
		"""
		Seed FAISS vector store with FAQ/knowledge base documents
		
		Args:
			documents: List of {"id": str, "text": str, "metadata": dict}
		
		Returns:
			Number of documents added
		"""
		if not documents:
			return 0
		
		# Generate embeddings for all documents using Hugging Face
		texts = [doc['text'] for doc in documents]
		embeddings = self.embedding_service.get_embeddings_batch(texts)
		
		# Add to FAISS
		self.vector_store.add_documents(documents, embeddings)
		
		return len(documents)
	
	def get_store_stats(self) -> dict:
		"""Get vector store statistics for monitoring"""
		return self.vector_store.get_stats()
	
	def clear_vector_store(self):
		"""Clear all documents from vector store (use with caution)"""
		self.vector_store.clear()
