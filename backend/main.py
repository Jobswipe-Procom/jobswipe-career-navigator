from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, jobs, alerts, cv_html
import os

app = FastAPI(title="JobBot Alternance API", version="0.1.0")

# CORS : base sur ALLOW_ORIGINS, puis ajoute quelques origines de dev utiles
origins = os.getenv("ALLOW_ORIGINS", "http://localhost:19006").split(",")
extra_origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://192.168.1.3:8081",
]
for origin in extra_origins:
    if origin not in origins:
        origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(cv_html.router) # No prefix for the CV HTML endpoint, or a suitable one

@app.get("/health")
def health():
    return {"status": "ok"}
