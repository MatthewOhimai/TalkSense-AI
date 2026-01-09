"""
Hugging Face Embeddings Service
Natural Language Understanding: Convert text to semantic vectors
"""

from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
import os
import hashlib
from django.core.cache import cache

class EmbeddingService:
	"""
	NLP-powered text embeddings using Hugging Face Sentence Transformers
	
	This service:
	- Converts text → numerical meaning (semantic vectors)
	- Captures semantic similarity between different phrasings
	- Enables meaning-based retrieval (not keyword-based)
	"""
	
	def __init__(self):
		# Use a lightweight, efficient model
		# all-MiniLM-L6-v2: Fast, 384 dimensions, great for semantic search
		model_name = os.getenv('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
		self.model = SentenceTransformer(model_name)
	
	def get_embedding(self, text: str) -> List[float]:
		"""
		Convert single text to embedding vector
		
		Args:
			text: Input text to embed
		
		Returns:
			Vector representation of the text (384 dimensions)
		"""
		if not text or not isinstance(text, str):
			raise ValueError("Text must be a non-empty string")
		
		# Check cache first (24h TTL for performance)
		cache_key = f"emb:{hashlib.md5(text.encode()).hexdigest()}"
		cached = cache.get(cache_key)
		if cached is not None:
			return cached
		
		embedding = self.model.encode(text, convert_to_tensor=False)
		result = embedding.tolist()
		
		# Cache for 24 hours
		cache.set(cache_key, result, timeout=86400)
		return result
	
	def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
		"""
		Convert multiple texts to embeddings (more efficient for batch processing)
		
		Args:
			texts: List of texts to embed
		
		Returns:
			List of vectors
		"""
		if not texts:
			return []
		
		# Batch encoding is faster and uses GPU if available
		embeddings = self.model.encode(texts, convert_to_tensor=False, batch_size=32)
		return [emb.tolist() for emb in embeddings]
	
	def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
		"""
		Calculate cosine similarity between two vectors
		
		Args:
			vec1, vec2: Embedding vectors
		
		Returns:
			Similarity score (0-1): 1 = identical meaning, 0 = completely different
		"""
		vec1 = np.array(vec1)
		vec2 = np.array(vec2)
		
		dot_product = np.dot(vec1, vec2)
		magnitude = np.linalg.norm(vec1) * np.linalg.norm(vec2)
		
		return float(dot_product / magnitude) if magnitude > 0 else 0.0
	
	def semantic_search(self, query_embedding: List[float], candidate_embeddings: List[List[float]], top_k: int = 5) -> List[int]:
		"""
		Find most semantically similar embeddings to a query
		
		Args:
			query_embedding: The search vector
			candidate_embeddings: Pool of vectors to search within
			top_k: Number of results to return
		
		Returns:
			Indices of top-k most similar candidates
		"""
		similarities = [
			self.cosine_similarity(query_embedding, candidate)
			for candidate in candidate_embeddings
		]
		
		# Get indices sorted by similarity (highest first)
		top_indices = sorted(
			range(len(similarities)),
			key=lambda i: similarities[i],
			reverse=True
		)[:top_k]
		
		return top_indices
