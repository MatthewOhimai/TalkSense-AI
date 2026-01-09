from pathlib import Path
from typing import List


def load_markdown(path: str) -> List[str]:
    """Load a markdown file and split it into text chunks.

    This simple chunker accumulates lines until a target character
    length is reached and then emits a chunk. It's intentionally
    simple and effective for small knowledge bases.
    """
    text = Path(path).read_text(encoding="utf-8")

    chunks: List[str] = []
    current = ""

    for line in text.split("\n"):
        current += line + "\n"
        if len(current) >= 800:  # ~500–600 tokens sweet spot
            chunks.append(current.strip())
            current = ""

    if current.strip():
        chunks.append(current.strip())

    return chunks
