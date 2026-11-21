"""
Groups nearby SOS reports into hotspots (DBSCAN-style), so the control room
sees "18 reports around Baghbor" and not 18 separate pins.
"""

from .geo import distance_m
from .schemas import Hotspot, HotspotRequest, HotspotResponse, Severity

WEIGHT = {Severity.CRITICAL: 4, Severity.HIGH: 2, Severity.MEDIUM: 1, Severity.LOW: 0.5}


def find(req: HotspotRequest) -> HotspotResponse:
    pts = req.points
    eps = req.radius_km * 1000
    n = len(pts)

    neighbours = [
        [j for j in range(n) if distance_m(pts[i].latitude, pts[i].longitude, pts[j].latitude, pts[j].longitude) <= eps]
        for i in range(n)
    ]

    label = [-1] * n
    cluster = 0
    for i in range(n):
        if label[i] != -1 or len(neighbours[i]) < req.min_reports:
            continue
        label[i] = cluster
        queue = list(neighbours[i])
        while queue:
            j = queue.pop()
            if label[j] == -1:
                label[j] = cluster
                if len(neighbours[j]) >= req.min_reports:
                    queue.extend(k for k in neighbours[j] if label[k] == -1)
        cluster += 1

    hotspots: list[Hotspot] = []
    for c in range(cluster):
        members = [pts[i] for i in range(n) if label[i] == c]
        lat = sum(p.latitude for p in members) / len(members)
        lng = sum(p.longitude for p in members) / len(members)
        spread = max(distance_m(lat, lng, p.latitude, p.longitude) for p in members) / 1000
        hotspots.append(Hotspot(
            center_latitude=round(lat, 6),
            center_longitude=round(lng, 6),
            radius_km=round(max(spread, 0.1), 2),
            report_count=len(members),
            critical_count=sum(p.severity == Severity.CRITICAL for p in members),
            priority_score=round(sum(WEIGHT[p.severity] for p in members), 1),
            references=[p.reference for p in members],
        ))

    hotspots.sort(key=lambda h: h.priority_score, reverse=True)
    return HotspotResponse(hotspots=hotspots, unclustered=label.count(-1))
