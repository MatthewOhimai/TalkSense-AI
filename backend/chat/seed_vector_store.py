"""
Example script to seed FAISS vector store with knowledge base documents

This demonstrates how to populate the semantic search with your FAQ, docs, etc.

Usage:
    python manage.py shell < seed_vector_store.py
    
Or in your Django app:
    from chat.services.rag_service import RAGService
    service = RAGService()
    service.seed_vector_store(documents)
"""

import os
import django

# This is needed when running outside Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'talksense.settings')
django.setup()

from chat.services.rag_service import RAGService
from chat.services.vector_store import VectorStore


def seed_faqs():
    """Seed vector store with example FAQ documents"""
    
    documents = [
        {
            "id": "faq_1",
            "text": "How do I reset my password? To reset your password, click 'Forgot Password' on the login page, enter your email, and follow the instructions sent to your inbox.",
            "metadata": {"category": "account", "type": "faq"}
        },
        {
            "id": "faq_2",
            "text": "How do I upgrade my account? Go to Settings > Billing and select your desired plan. You'll be able to upgrade or downgrade at any time.",
            "metadata": {"category": "billing", "type": "faq"}
        },
        {
            "id": "faq_3",
            "text": "What payment methods do you accept? We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers.",
            "metadata": {"category": "billing", "type": "faq"}
        },
        {
            "id": "faq_4",
            "text": "How do I export my chat history? Visit Settings > Data & Privacy and click 'Export Chats'. Your data will be available as a JSON file.",
            "metadata": {"category": "privacy", "type": "faq"}
        },
        {
            "id": "faq_5",
            "text": "Can I delete my account? Yes, go to Settings > Account > Delete Account. This will permanently remove all your data.",
            "metadata": {"category": "account", "type": "faq"}
        },
        {
            "id": "guide_1",
            "text": "Getting started with TalkSense AI. First, create an account. Then, create a new chat session. You can ask any question and TalkSense will provide intelligent responses using semantic understanding.",
            "metadata": {"category": "getting_started", "type": "guide"}
        },
        {
            "id": "guide_2",
            "text": "Understanding chat sessions. Each session is a separate conversation thread. You can have multiple sessions for different topics. Sessions maintain full conversation history for context.",
            "metadata": {"category": "features", "type": "guide"}
        },
        {
            "id": "guide_3",
            "text": "Rate and provide feedback. After each response, you can rate the answer from 1-5 stars. Your feedback helps us improve the AI model.",
            "metadata": {"category": "features", "type": "guide"}
        },
        {
            "id": "tech_1",
            "text": "TalkSense AI uses advanced NLP. We combine semantic understanding (Hugging Face embeddings) with intelligent reasoning (Google Gemini) to provide context-aware responses.",
            "metadata": {"category": "technology", "type": "docs"}
        },
        {
            "id": "tech_2",
            "text": "How semantic search works. When you ask a question, we convert it to a semantic vector. We then search our knowledge base for documents with similar meaning, not just keyword matches.",
            "metadata": {"category": "technology", "type": "docs"}
        },
    ]
    
    print("🌱 Seeding vector store with documents...")
    print(f"📊 Total documents: {len(documents)}")
    
    rag_service = RAGService()
    
    # Add documents to vector store
    num_added = rag_service.seed_vector_store(documents)
    
    print(f"✅ Successfully added {num_added} documents")
    
    # Show stats
    stats = rag_service.get_store_stats()
    print(f"📈 Vector store stats: {stats}")
    
    return num_added


def test_semantic_search():
    """Test semantic search functionality"""
    
    print("\n🔍 Testing semantic search...")
    print("=" * 50)
    
    rag_service = RAGService()
    vector_store = VectorStore()
    
    # Test queries
    queries = [
        "I forgot my password, how do I recover it?",
        "How much does the premium plan cost?",
        "Can I export my conversations?",
        "How does AI work?",
    ]
    
    for query in queries:
        print(f"\n📝 Query: {query}")
        
        # Get embedding
        embedding = rag_service.embedding_service.get_embedding(query)
        
        # Search
        results = vector_store.search(embedding, top_k=3)
        
        if results:
            print("   Top results:")
            for i, result in enumerate(results, 1):
                print(f"   {i}. {result['text'][:60]}... (distance: {result['distance']:.4f})")
        else:
            print("   No results found")
    
    print("\n" + "=" * 50)


def clear_vector_store():
    """Clear all documents from vector store"""
    print("⚠️  Clearing vector store...")
    rag_service = RAGService()
    rag_service.clear_vector_store()
    print("✅ Vector store cleared")


# Run the seeding
if __name__ == "__main__":
    print("🚀 TalkSense AI - Vector Store Seeding Script")
    print("=" * 50)
    
    # Seed with documents
    seed_faqs()
    
    # Test semantic search
    test_semantic_search()
    
    print("\n✨ Done! Vector store is ready for RAG queries")
