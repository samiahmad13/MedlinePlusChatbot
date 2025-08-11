import os
import json
from typing import List, Dict, Any
from lxml import etree
from sentence_transformers import SentenceTransformer
import faiss
from urllib.parse import urlparse


class RAGPipeline:
    def __init__(
        self, xml_path: str, index_path="faiss_index.bin", doc_path="documents.json"
    ):
        self.xml_path = xml_path
        self.index_path = index_path
        self.doc_path = doc_path
        self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        self.index = None
        self.documents: List[Dict[str, Any]] = []

        if os.path.exists(index_path) and os.path.exists(doc_path):
            print("Loading cached FAISS index and documents...")
            self._load_cache()
        else:
            print("Building FAISS index from scratch...")
            self._build_index()

    def _parse_xml(self) -> List[Dict[str, Any]]:
        print("Parsing MedlinePlus XML...")
        tree = etree.parse(self.xml_path)
        root = tree.getroot()

        docs: List[Dict[str, Any]] = []

        for node in root.iter():
            if not (isinstance(node.tag, str) and node.tag.endswith("health-topic")):
                continue

            title_el = node.find(".//title")
            title = (title_el.text or "").strip() if title_el is not None else ""

            fs_el = node.find(".//full-summary")
            summary = (fs_el.text or "").strip() if fs_el is not None else ""
            if not summary:
                sd_el = node.find(".//standard-description")
                if sd_el is not None and sd_el.text:
                    summary = sd_el.text.strip()

            if not title or not summary:
                continue

            topic_id = node.get("id") or ""

            sources = []
            for s in node.findall(".//site"):
                url = s.get("url") or ""
                if not url:
                    url_el = s.find(".//url")
                    url = (url_el.text or "").strip() if url_el is not None else ""

                label = ""
                if s.text and s.text.strip():
                    label = s.text.strip()
                else:
                    name_el = s.find(".//name")
                    if name_el is not None and name_el.text:
                        label = name_el.text.strip()

                if not label:
                    try:
                        label = urlparse(url).netloc or url
                    except Exception:
                        label = url

                if url:
                    sources.append({"title": label, "url": url})

            seen = set()
            uniq_sources = []
            for src in sources:
                u = (src.get("url") or "").strip()
                if u and u not in seen:
                    uniq_sources.append(
                        {"title": src.get("title") or "Untitled", "url": u}
                    )
                    seen.add(u)

            permalink = f"https://medlineplus.gov/{topic_id}.html" if topic_id else ""
            if permalink and permalink not in seen:
                uniq_sources.insert(0, {"title": title, "url": permalink})
                seen.add(permalink)

            if not uniq_sources:
                fallback_url = permalink or "https://medlineplus.gov/healthtopics.html"
                uniq_sources = [{"title": title or "MedlinePlus", "url": fallback_url}]

            docs.append(
                {
                    "id": topic_id,
                    "title": title,
                    "text": summary,
                    "sources": uniq_sources[:8],
                }
            )

        print(f"Parsed {len(docs)} records from XML.")
        return docs

    def _build_index(self):
        self.documents = self._parse_xml()
        if not self.documents:
            raise ValueError("No valid text records were found in the parsed XML.")

        print("Embedding documents...")
        texts = [d["text"] for d in self.documents]
        embeddings = self.model.encode(
            texts, show_progress_bar=True, convert_to_numpy=True
        )

        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dim)
        self.index.add(embeddings)

        print(f"Caching index to {self.index_path} and documents to {self.doc_path}")
        faiss.write_index(self.index, self.index_path)
        with open(self.doc_path, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, ensure_ascii=False)

    def _load_cache(self):
        self.index = faiss.read_index(self.index_path)
        with open(self.doc_path, "r", encoding="utf-8") as f:
            self.documents = json.load(f)

    # ---------- QUERY ----------

    def query(
        self, query_text: str, top_k: int = 5, min_relevance: float = 0.6
    ) -> List[Dict[str, Any]]:
        if not query_text or self.index is None or not self.documents:
            return []

        # Encode query and search
        query_embedding = self.model.encode([query_text], convert_to_numpy=True)
        D, I = self.index.search(query_embedding, top_k)

        dists = [float(d) for d in D[0]]
        if not dists:
            return []

        # Normalize to 0–1 where 1 = best match
        dmin, dmax = min(dists), max(dists)
        denom = (dmax - dmin) if (dmax - dmin) > 1e-12 else 1.0
        relevances = [1.0 - ((d - dmin) / denom) for d in dists]

        results = []
        for idx, dist, rel in zip(I[0], dists, relevances):
            if idx < 0:
                continue
            doc = self.documents[idx]
            text = doc.get("text", "")
            snippet = (text[:220] + "…") if len(text) > 220 else text

            srcs = list(doc.get("sources", []))
            enriched_sources = []
            seen_urls = set()
            for s in srcs:
                u = (s.get("url") or "").strip()
                if not u or u in seen_urls:
                    continue
                enriched_sources.append(
                    {
                        "title": s.get("title") or "Untitled",
                        "url": u,
                        "snippet": snippet,
                        "relevance": rel,
                        "score": rel,
                    }
                )
                seen_urls.add(u)

            results.append(
                {
                    "title": doc.get("title", "Untitled"),
                    "text": text,
                    "sources": enriched_sources,
                    "raw_distance": dist,
                    "relevance": rel,
                    "score": rel,
                }
            )

        # Threshold filter
        filtered = [r for r in results if r["relevance"] >= min_relevance]
        if not filtered and results:
            filtered = [max(results, key=lambda x: x["relevance"])]

        return filtered
