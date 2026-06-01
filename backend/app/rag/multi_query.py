"""
Multi-Query Expansion with BM25 search and Reciprocal Rank Fusion.
Generates query variations via LLM, runs BM25 for each, merges with RRF.
"""
import logging
import math
import re
from collections import Counter
from typing import List, Dict, Any, Optional

from huggingface_hub import InferenceClient
from app.config import get_settings
from app.rag.vectorstore import get_chroma_client, get_collection_name

logger = logging.getLogger(__name__)
settings = get_settings()

_multi_query_llm = None


def _get_llm_client() -> InferenceClient:
    global _multi_query_llm
    if _multi_query_llm is None:
        _multi_query_llm = InferenceClient(token=settings.HF_TOKEN)
    return _multi_query_llm


def _tokenize(text: str) -> List[str]:
    return re.findall(r"\w+", text.lower())


class BM25:
    def __init__(self, corpus: List[str], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.corpus = [_tokenize(doc) for doc in corpus]
        self.doc_len = [len(doc) for doc in self.corpus]
        self.avg_doc_len = sum(self.doc_len) / self.corpus_size if self.corpus_size else 0.0
        self.df: Counter = Counter()
        self.idf: Dict[str, float] = {}
        if self.corpus_size:
            self._build_index()

    def _build_index(self):
        for doc in self.corpus:
            for term in set(doc):
                self.df[term] += 1
        for term, freq in self.df.items():
            self.idf[term] = math.log(1.0 + (self.corpus_size - freq + 0.5) / (freq + 0.5))

    def get_scores(self, query_tokens: List[str]) -> List[float]:
        scores = []
        for i, doc in enumerate(self.corpus):
            score = 0.0
            doc_counter = Counter(doc)
            for term in query_tokens:
                if term in self.idf:
                    tf = doc_counter.get(term, 0)
                    numerator = tf * (self.k1 + 1.0)
                    denominator = tf + self.k1 * (1.0 - self.b + self.b * self.doc_len[i] / self.avg_doc_len)
                    score += self.idf[term] * numerator / denominator
            scores.append(score)
        return scores


def generate_query_variations(query: str, num_variations: int = 4) -> List[str]:
    client = _get_llm_client()

    prompt = (
        f"Generate {num_variations} different paraphrased versions of the "
        f"following search query. Each version must preserve the original meaning "
        f"but use different words and phrasing.\n"
        f"Return each on a new line numbered 1. to {num_variations}.\n"
        f"Do not include any other text or explanation.\n\n"
        f"Original query: {query}\n\n"
        f"Paraphrased queries:"
    )

    try:
        response = client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model=settings.LLM_MODEL,
            max_tokens=256,
            temperature=0.7,
        )
        text = response.choices[0].message.content.strip()
        variations = []
        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue
            clean = re.sub(r"^\d+[\.\)]\s*", "", line).strip()
            if clean and clean.lower() != query.lower():
                variations.append(clean)
        return variations[:num_variations]
    except Exception as e:
        logger.warning(f"Failed to generate query variations: {e}")
        return []


def _get_chunks_from_store(
    user_id: str,
    document_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    client = get_chroma_client()
    collection_name = get_collection_name(user_id)

    try:
        collection = client.get_collection(name=collection_name)
    except Exception:
        logger.warning(f"Collection {collection_name} not found for BM25")
        return []

    where_filter = None
    if document_id:
        where_filter = {"document_id": {"$eq": document_id}}

    results = collection.get(
        where=where_filter,
        include=["documents", "metadatas"],
    )

    chunks = []
    if results and results.get("documents"):
        for i, doc in enumerate(results["documents"]):
            metadata = results["metadatas"][i] if results.get("metadatas") else {}
            chunks.append({
                "text": doc,
                "filename": metadata.get("filename", ""),
                "document_id": metadata.get("document_id", ""),
                "page": metadata.get("page", 1),
            })

    return chunks


def reciprocal_rank_fusion(
    results_list: List[List[Dict[str, Any]]],
    k: int = 60,
) -> List[Dict[str, Any]]:
    rrf_scores: Dict[str, float] = {}
    doc_map: Dict[str, Dict[str, Any]] = {}

    for rank_list in results_list:
        for rank, chunk in enumerate(rank_list):
            doc_key = chunk["text"]
            rrf_scores[doc_key] = rrf_scores.get(doc_key, 0.0) + 1.0 / (k + rank + 1)
            if doc_key not in doc_map:
                doc_map[doc_key] = chunk

    sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

    results = []
    for doc_key, score in sorted_docs:
        chunk = dict(doc_map[doc_key])
        chunk["score"] = round(score, 4)
        results.append(chunk)

    return results


def multi_query_retrieve(
    query: str,
    user_id: str,
    document_id: Optional[str] = None,
    num_variations: int = 4,
    top_k_per_query: int = 20,
    top_k_final: int = 10,
) -> List[Dict[str, Any]]:
    chunks = _get_chunks_from_store(user_id, document_id)
    if not chunks:
        return []

    variations = generate_query_variations(query, num_variations)
    all_queries = [query] + variations

    corpus = [chunk["text"] for chunk in chunks]
    bm25 = BM25(corpus)

    all_results = []
    for q in all_queries:
        query_tokens = _tokenize(q)
        scores = bm25.get_scores(query_tokens)
        scored_indices = [(i, scores[i]) for i in range(len(scores))]
        scored_indices.sort(key=lambda x: x[1], reverse=True)

        top_results = []
        for idx, score in scored_indices[:top_k_per_query]:
            if score > 0:
                chunk = dict(chunks[idx])
                chunk["score"] = round(score, 4)
                top_results.append(chunk)

        if top_results:
            all_results.append(top_results)

    if not all_results:
        return []

    fused = reciprocal_rank_fusion(all_results)
    return fused[:top_k_final]
