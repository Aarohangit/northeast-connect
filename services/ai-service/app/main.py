import logging

from fastapi import FastAPI

from . import duplicates, hotspots, triage_llm, triage_rules
from .schemas import (DuplicateRequest, DuplicateResponse, HotspotRequest, HotspotResponse, TriageRequest,
                      TriageResult)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="ai-service", description="SOS report triage, duplicate detection and hotspots", version="1.0")


@app.get("/actuator/health")
def health():
    return {"status": "UP", "engine": "claude" if triage_llm.available() else "rules", "model": triage_llm.MODEL}


@app.post("/api/ai/triage", response_model=TriageResult)
def triage(req: TriageRequest) -> TriageResult:
    """Suggests category and severity. The officer always makes the final call."""
    return triage_llm.triage(req) or triage_rules.triage(req)


@app.post("/api/ai/duplicates", response_model=DuplicateResponse)
def find_duplicates(req: DuplicateRequest) -> DuplicateResponse:
    return duplicates.find(req)


@app.post("/api/ai/hotspots", response_model=HotspotResponse)
def find_hotspots(req: HotspotRequest) -> HotspotResponse:
    return hotspots.find(req)
