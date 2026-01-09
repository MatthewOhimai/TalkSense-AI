from django.core.management.base import BaseCommand
from django.conf import settings
from pathlib import Path

from chat.services.vector_store import VectorStore


class Command(BaseCommand):
    help = "Seed FAISS vector store from backend/knowledge_base/talk_sense_expert_knowledge.md"

    def handle(self, *args, **options):
        kb_path = Path(settings.BASE_DIR) / "knowledge_base" / "talk_sense_expert_knowledge.md"

        if not kb_path.exists():
            self.stderr.write(self.style.ERROR(f"Knowledge base file not found: {kb_path}"))
            return

        self.stdout.write(self.style.NOTICE(f"Seeding FAISS from: {kb_path}"))

        store = VectorStore()
        # Build from markdown will chunk, embed and add documents
        store.build_from_markdown(str(kb_path))

        stats = store.get_stats()
        self.stdout.write(self.style.SUCCESS(f"FAISS seeded. Stats: {stats}"))
