from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from openai import OpenAI
import traceback
from dotenv import load_dotenv
from rag_pipeline import RAGPipeline
import os

load_dotenv()

# configure OpenAI client via OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENAI_API_KEY"),
)

REFERER = "http://localhost:5173"
TITLE = "CuraLinkAI"

app = FastAPI()

# cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGPipeline("/Users/samiahmad/Downloads/curalinkai/mplus_topics_2025-07-19.xml")


class ChatMessage(BaseModel):
    """Represents a single message in the chat history."""

    role: str
    content: str


class ChatRequest(BaseModel):
    """Schema for incoming chat requests from the frontend."""

    question: str
    chatHistory: List[ChatMessage]


@app.post("/chat")
async def chat(req: ChatRequest):
    # query RAG pipeline for relevant documents
    retrieved = rag.query(req.question) or []

    # concatenate text for LLM context
    if retrieved:
        context_text = "\n\n".join(
            [doc.get("text", "") for doc in retrieved if doc.get("text")]
        )
    else:
        # fallback
        context_text = "No retrieved RAG context was available. Answer the question using only general, safe medical knowledge and standard guidelines."

    # construct message history for LLM
    messages = [
        {
            "role": "system",
            "content": f"You are a helpful medical assistant called CuraLinkAI. Use the following context:\n\n{context_text}\n\nYou ONLY respond to medical-related questions. DO NOT RESPOND TO ANYTHING ELSE! Respond in plain text WITHOUT MARKDOWN or emojis. Do not use bullets or numbered lists. Keep a friendly, respectful tone with medical advice only.",
        }
    ]

    # append history to maintain conversation flow
    for msg in req.chatHistory:
        role = "user" if msg.role in ["user", "human"] else "assistant"
        content = (msg.content or "").strip()
        if content:
            messages.append({"role": role, "content": content})

    # call LLM
    try:
        completion = client.chat.completions.create(
            model="tngtech/deepseek-r1t2-chimera:free",
            messages=messages,
            temperature=0.7,
            extra_headers={"HTTP-Referer": REFERER, "X-Title": TITLE},
        )
        if completion and completion.choices:
            answer = completion.choices[0].message.content
        else:
            # fallback
            print("LLM call returned no choices.")
            print("Raw response:", completion)
            answer = "Sorry, I encountered an issue calling the language model."
    except Exception as e:
        print("LLM error occurred:")
        traceback.print_exc()
        if hasattr(e, "response"):
            try:
                print("OpenRouter error response:", e.response.json())
            except Exception:
                pass
        answer = "Sorry, I encountered an issue calling the language model."

    # Extract and return sources
    sources = [
        {
            "title": doc.get("title", "Untitled"),
            "url": doc.get("url", ""),
            "score": doc.get("score", None),
        }
        for doc in retrieved
    ]

    # fallback source
    if not sources:
        sources = [
            {
                "title": "MedlinePlus Health Topics",
                "url": "https://medlineplus.gov/healthtopics.html",
                "score": None,
            }
        ]

    return {"answer": answer, "sources": sources}
