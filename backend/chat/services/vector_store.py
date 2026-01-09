"""
FAISS Vector Store Service
Semantic Memory: Fast semantic search on embeddings
"""

import faiss
import numpy as np
import pickle
import os
from typing import List, Dict, Optional
from django.core.cache import cache

from .embedding_service import EmbeddingService
from .document_loader import load_markdown

class VectorStore:
	"""
	FAISS-powered semantic search
	
	This service:
	- Stores embeddings in memory for fast retrieval
	- Searches by meaning, not keywords
	- Enables contextual awareness
	"""
	
	def __init__(self):
		self.dimension = 384  # all-MiniLM-L6-v2 output dimension
		self.index = None
		self.documents = {}  # Store metadata: {id: {"text": str, "metadata": dict}}
		self.ids_map = {}    # Map index position to document id
		self.index_count = 0
		
		# Load existing index if it exists
		self.index_path = os.getenv('FAISS_INDEX_PATH', './faiss_index.bin')
		self.docs_path = os.getenv('FAISS_DOCS_PATH', './faiss_docs.pkl')
		
		self._load_index()
	
	def _create_index(self):
		"""Create new FAISS index"""
		# Using IndexFlatL2 for accurate cosine similarity
		self.index = faiss.IndexFlatL2(self.dimension)
	
	def _load_index(self):
		"""Load existing index from disk"""
		try:
			if os.path.exists(self.index_path) and os.path.exists(self.docs_path):
				self.index = faiss.read_index(self.index_path)
				
				with open(self.docs_path, 'rb') as f:
					data = pickle.load(f)
					self.documents = data.get('documents', {})
					self.ids_map = data.get('ids_map', {})
					self.index_count = len(self.documents)
			else:
				self._create_index()
		except Exception as e:
			print(f"Failed to load FAISS index: {e}. Creating new one.")
			self._create_index()
	
	def add_documents(self, documents: List[Dict], embeddings: List[List[float]]):
		"""
		Add documents with embeddings to vector store
		
		Args:
			documents: List of {"id": str, "text": str, "metadata": dict}
			embeddings: List of embedding vectors (matching documents)
		"""
		if not documents or not embeddings:
			return
		
		if len(documents) != len(embeddings):
			raise ValueError("Documents and embeddings count must match")
		
		if self.index is None:
			self._create_index()
		
		# Convert embeddings to numpy array
		embeddings_array = np.array(embeddings, dtype=np.float32)
		
		# Add to FAISS
		self.index.add(embeddings_array)
		
		# Store metadata
		for i, doc in enumerate(documents):
			doc_id = doc['id']
			self.documents[doc_id] = {
				'text': doc['text'],
				'metadata': doc.get('metadata', {})
			}
			self.ids_map[self.index_count + i] = doc_id
		
		self.index_count += len(documents)
		
		# Persist to disk
		self.persist()
	
	def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict]:
		"""
		Semantic search: Find documents with similar meaning
		
		Args:
			query_embedding: The search vector from user query
			top_k: Number of results to return
		
		Returns:
			List of {"id": str, "text": str, "distance": float, "metadata": dict}
		"""
		if self.index is None or self.index_count == 0:
			return []
		
		# Ensure we have data
		if self.index.ntotal == 0:
			return []
		
		# Convert to numpy array (FAISS expects float32)
		query_array = np.array([query_embedding], dtype=np.float32)
		
		# Search (returns distances and indices)
		distances, indices = self.index.search(query_array, min(top_k, self.index_count))
		
		results = []
		for i, idx in enumerate(indices[0]):
			if idx == -1:  # Invalid index
				continue
			
			doc_id = self.ids_map.get(idx)
			if not doc_id or doc_id not in self.documents:
				continue
			
			doc = self.documents[doc_id]
			results.append({
				'id': doc_id,
				'text': doc['text'],
				'distance': float(distances[0][i]),
				'metadata': doc['metadata']
			})
		
		return results
	
	def delete_document(self, doc_id: str):
		"""Remove a document (mark as deleted, not true removal)"""
		if doc_id in self.documents:
			del self.documents[doc_id]
			self.persist()
	
	def clear(self):
		"""Clear all data"""
		self.index = None
		self.documents = {}
		self.ids_map = {}
		self.index_count = 0
		self._create_index()
		self.persist()
	
	def get_stats(self) -> Dict:
		"""Get vector store statistics"""
		return {
			'total_documents': len(self.documents),
			'index_size': self.index.ntotal if self.index else 0,
			'dimension': self.dimension,
		}
	
	def persist(self):
		"""Save index and documents to disk"""
		try:
			if self.index is not None:
				faiss.write_index(self.index, self.index_path)
			
			with open(self.docs_path, 'wb') as f:
				pickle.dump({
					'documents': self.documents,
					'ids_map': self.ids_map
				}, f)
		except Exception as e:
			print(f"Failed to persist FAISS index: {e}")

	def build_from_markdown(self, md_path: str):
		"""Load a markdown file, chunk it, embed chunks and add to the index.

		This method is idempotent with respect to persisted documents when
		run multiple times (it will append new chunks as new doc ids).
		"""
		if not os.path.exists(md_path):
			print(f"Markdown file not found: {md_path}")
			return

		chunks = load_markdown(md_path)
		if not chunks:
			print("No chunks found in markdown")
			return

		# Use embedding service to get vectors
		emb_service = EmbeddingService()
		embeddings = emb_service.get_embeddings_batch(chunks)

		# Prepare docs payload
		docs = []
		start_index = len(self.documents)
		for i, chunk in enumerate(chunks):
			doc_id = f"kb-{start_index + i}"
			docs.append({
				'id': doc_id,
				'text': chunk,
				'metadata': {'source': os.path.basename(md_path), 'chunk_index': i}
			})

		# Add to vector store
		self.add_documents(docs, embeddings)
		print(f"✅ FAISS loaded with {self.index.ntotal} vectors from {md_path}")
