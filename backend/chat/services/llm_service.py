"""
Google Gemini LLM Service
Natural Language Generation + Reasoning: Intelligent conversation
"""

from google import genai
from google.genai import errors as genai_errors
import time
from django.conf import settings
from typing import Optional


class LLMService:
	"""
	Google Gemini API integration using the genai.Client pattern.
	"""

	def __init__(self):
		api_key = getattr(settings, "GEMINI_API_KEY", None)
		if not api_key:
			raise ValueError("GEMINI_API_KEY must be set in Django settings")

		self.client = genai.Client(api_key=api_key)
		self.model_name = "gemini-2.5-flash"  # Use stable flash model

		self.safety_settings = [
			{
				"category": "HARM_CATEGORY_HARASSMENT",
				"threshold": "BLOCK_MEDIUM_AND_ABOVE",
			},
			{
				"category": "HARM_CATEGORY_HATE_SPEECH",
				"threshold": "BLOCK_MEDIUM_AND_ABOVE",
			},
			{
				"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
				"threshold": "BLOCK_MEDIUM_AND_ABOVE",
			},
		]

	def generate_response(
		self,
		prompt: str,
		context: Optional[str] = None,
		temperature: float = 0.3,
		max_tokens: int = 2000,
	) -> dict:
		"""
		Generate response using the genai.Client API.

		Returns: {"text": str, "tokens_used": int}
		"""

		system_message = (
			"""You are TalkSense AI, a helpful and knowledgeable assistant.

		Rules:
		- Answer directly without preamble or disclaimers
		- If context is missing, use your general knowledge - do NOT mention context availability
		- Be concise but complete
		- DO NOT include a "Sources" section (the UI handles this)
		- Format with headers/bullets if helpful"""
		)

		if context:
			final_prompt = f"""{system_message}

=== CONTEXT ===
{context}
===============

Question: {prompt}

Answer the question using the context when relevant. Supplement with your knowledge if needed."""
		else:
			final_prompt = f"""{system_message}

User Question: {prompt}"""

		# Retry loop with exponential backoff for transient errors
		attempts = 3
		backoff = 1

		for attempt in range(1, attempts + 1):
			try:
				response = self.client.models.generate_content(
					model=self.model_name,
					contents=final_prompt,
					config=genai.types.GenerateContentConfig(
						temperature=temperature,
						max_output_tokens=max_tokens,
					),
				)

				tokens_used = 0
				if hasattr(response, "usage_metadata") and response.usage_metadata:
					tokens_used = getattr(response.usage_metadata, "output_tokens", 0)

				return {"text": getattr(response, "text", str(response)), "tokens_used": tokens_used}
			except genai_errors.ServerError as e:
				# Server-side issues (e.g., overloaded). Retry a few times then fallback.
				msg = str(e)
				if attempt < attempts:
					time.sleep(backoff)
					backoff *= 2
					continue
				# Final attempt failed — return graceful fallback
				return {"text": "⚠️ The AI is currently busy. Please try again in a moment.", "tokens_used": 0, "fallback": True, "reason": msg}
			except Exception as e:
				# Non-server error (network, auth). Return a safe fallback instead of raising.
				msg = str(e)
				return {"text": "⚠️ The AI is temporarily unavailable. Please try again later.", "tokens_used": 0, "fallback": True, "reason": msg}

	def stream_response(
		self,
		prompt: str,
		context: Optional[str] = None,
		temperature: float = 0.3,
		max_tokens: int = 2000,
	):
		"""
		Stream response for real-time frontend updates. Yields text chunks.
		"""
		system_message = (
			"""You are TalkSense AI, a helpful and knowledgeable assistant.

		Rules:
		- Answer directly without preamble or disclaimers
		- If context is missing, use your general knowledge - do NOT mention context availability
		- Be concise but complete
		- DO NOT include a "Sources" section (the UI handles this)
		- Format with headers/bullets if helpful"""
		)

		if context:
			final_prompt = f"""{system_message}

=== CONTEXT ===
{context}
===============

Question: {prompt}

Answer the question using the context when relevant. Supplement with your knowledge if needed."""
		else:
			final_prompt = f"""{system_message}

User Question: {prompt}"""

		import time
		start_time = time.time()
		try:
			response = self.client.models.generate_content_stream(
				model=self.model_name,
				contents=final_prompt,
				config=genai.types.GenerateContentConfig(
					temperature=temperature,
					max_output_tokens=max_tokens,
				),
			)

			for chunk in response:
				if hasattr(chunk, "text") and chunk.text:
					yield chunk.text
				else:
					# Skip empty or usage-only chunks if they don't have text
					continue
		except Exception as e:
			import logging
			logger = logging.getLogger(__name__)
			logger.error(f"LLM streaming error: {str(e)}")
			yield "Sorry, something went wrong. Please try again in a moment."

	def count_tokens(self, text: str) -> int:
		"""Estimate token count for text (approx)."""
		return len(text) // 4
