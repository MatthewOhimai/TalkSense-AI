from django.apps import AppConfig
import os


class ChatConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat'

    def ready(self):
        # When using Django's autoreloader, `ready()` may be called twice
        # (once in the parent watcher process and once in the child). Run
        # heavy initialization only in the reloader child process.
        if os.environ.get('RUN_MAIN') != 'true':
            return
        """Preload models and vector store at Django startup for faster first requests."""
        try:
            # Preload embedding model and vector store to avoid lazy-load latency
            from .services.embedding_service import EmbeddingService
            from .services.vector_store import VectorStore

            print("[TalkSense] Preloading embedding model...")
            try:
                embedding_service = EmbeddingService()
                # Trigger a small embedding to warm model (ignore failures)
                try:
                    embedding_service.get_embedding("startup")
                except Exception:
                    pass
                print("✅ [TalkSense] Embedding model loaded (or initialized)")
            except Exception as e:
                print(f"⚠️  [TalkSense] EmbeddingService init warning: {e}")

            print("[TalkSense] Initializing FAISS vector store...")
            try:
                vector_store = VectorStore()
                idx_count = 0
                try:
                    idx_count = vector_store.index.ntotal if vector_store.index is not None else 0
                except Exception:
                    idx_count = 0
                print(f"✅ [TalkSense] FAISS initialized (total vectors: {idx_count})")
            except Exception as e:
                print(f"⚠️  [TalkSense] VectorStore init warning: {e}")

        except Exception as e:
            # Avoid crashing Django startup if optional components fail
            print(f"⚠️  [TalkSense] Startup initialization warning: {e}")

    from .services.vector_store import VectorStore

    vs = VectorStore()
    if vs.index is None or vs.index.ntotal == 0:
        vs.build_from_markdown("backend/knowledge_base/talk_sense_expert_knowledge.md")

