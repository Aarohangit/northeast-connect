"""
Duplicate SOS detection. In a flood, the same family is often reported by
three relatives from three phones. Deterministic on purpose: an officer has
to be able to see exactly why two reports were linked.
"""

import re
from difflib import SequenceMatcher

from .geo import distance_m
from .schemas import DuplicateMatch, DuplicateRequest, DuplicateResponse

NEAR_M = 150
CLOSE_M = 500
WINDOW_MIN = 180
THRESHOLD = 0.6


def _digits(phone: str | None) -> str:
    return re.sub(r"\D", "", phone or "")[-10:]


def _norm(text: str | None) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", (text or "").lower())).strip()


def find(req: DuplicateRequest) -> DuplicateResponse:
    r = req.report
    matches: list[DuplicateMatch] = []

    for c in req.candidates:
        if c.reference == r.reference:
            continue

        dist = distance_m(r.latitude, r.longitude, c.latitude, c.longitude)
        minutes = abs((r.received_at - c.received_at).total_seconds()) / 60
        reasons: list[str] = []
        score = 0.0

        same_phone = bool(_digits(r.phone)) and _digits(r.phone) == _digits(c.phone)
        if same_phone:
            score += 0.6
            reasons.append("same phone number")

        if minutes > WINDOW_MIN and not same_phone:
            continue

        if dist <= NEAR_M:
            score += 0.4
            reasons.append(f"{int(dist)} m apart")
        elif dist <= CLOSE_M:
            score += 0.2
            reasons.append(f"{int(dist)} m apart")
        elif not same_phone:
            continue

        if minutes <= 30:
            score += 0.15
            reasons.append(f"{int(minutes)} min apart")
        elif minutes <= WINDOW_MIN:
            score += 0.05

        if r.category and r.category == c.category:
            score += 0.1
            reasons.append("same category")

        a, b = _norm(r.description), _norm(c.description)
        if a and b:
            sim = SequenceMatcher(None, a, b).ratio()
            if sim >= 0.5:
                score += 0.25 * sim
                reasons.append(f"similar description ({int(sim * 100)}%)")

        score = round(min(score, 1.0), 2)
        if score >= 0.35:
            matches.append(DuplicateMatch(reference=c.reference, score=score, distance_m=int(dist),
                                          minutes_apart=int(minutes), reasons=reasons))

    matches.sort(key=lambda m: m.score, reverse=True)
    return DuplicateResponse(likely_duplicate=bool(matches) and matches[0].score >= THRESHOLD,
                             matches=matches[:5])
