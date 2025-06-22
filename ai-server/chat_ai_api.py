from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

chatbot = pipeline(
    "text-generation",
    model="skt/kogpt2-base-v2",
    tokenizer="skt/kogpt2-base-v2"
)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    user_message = req.message
    result = chatbot(
        user_message,
        max_new_tokens=30,
        do_sample=True,
        temperature=0.7,
        top_p=0.9
    )

    reply = result[0]['generated_text']
    trimmed_reply = reply[len(user_message):].strip() if reply.startswith(user_message) else reply

    # 소설방지: 길면 자르기
    if len(trimmed_reply) > 100:
        trimmed_reply = trimmed_reply[:100] + '...'

    return {"reply": trimmed_reply}
