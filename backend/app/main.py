from fastapi import FastAPI


app = FastAPI(title="location_rag API")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"message": "Spatial RAG API running"}

