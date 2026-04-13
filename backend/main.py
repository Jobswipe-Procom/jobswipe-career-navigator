from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, jobs, alerts, cv_html, generator
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="JobSwipe API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(cv_html.router)
app.include_router(generator.router, tags=["generator"])

@app.get("/health")
def health():
    return {"status": "ok"}
