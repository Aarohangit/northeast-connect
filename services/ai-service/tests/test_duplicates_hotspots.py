from datetime import datetime, timedelta, timezone

from app import duplicates, hotspots
from app.schemas import DuplicateRequest, HotspotRequest, Point, Report, Severity

NOW = datetime(2026, 11, 21, 6, 0, tzinfo=timezone.utc)


def report(ref, lat, lng, minutes_ago=0, phone=None, desc=None, category="TRAPPED_IN_WATER"):
    return Report(reference=ref, latitude=lat, longitude=lng, received_at=NOW - timedelta(minutes=minutes_ago),
                  phone=phone, category=category, description=desc)


def test_relative_reporting_same_family_is_flagged():
    new = report("AS-NEW", 26.2705, 90.8644, desc="my brother's family 6 people on roof water rising near school")
    original = report("AS-OLD", 26.2702, 90.8641, minutes_ago=8, phone="9000000001",
                      desc="6 of us on roof water rising near school")
    far_away = report("AS-FAR", 26.50, 91.20, minutes_ago=5)
    r = duplicates.find(DuplicateRequest(report=new, candidates=[original, far_away]))
    assert r.likely_duplicate
    assert r.matches[0].reference == "AS-OLD"
    assert all(m.reference != "AS-FAR" for m in r.matches)


def test_same_phone_is_linked_even_if_moved():
    new = report("AS-NEW", 26.30, 90.90, phone="+91 98640 12345")
    earlier = report("AS-OLD", 26.36, 90.95, minutes_ago=90, phone="9864012345")
    r = duplicates.find(DuplicateRequest(report=new, candidates=[earlier]))
    assert r.likely_duplicate
    assert "same phone number" in r.matches[0].reasons


def test_nearby_but_hours_apart_is_not_a_duplicate():
    new = report("AS-NEW", 26.27, 90.86)
    old = report("AS-OLD", 26.27, 90.86, minutes_ago=600)
    assert not duplicates.find(DuplicateRequest(report=new, candidates=[old])).likely_duplicate


def test_hotspots_group_nearby_reports_and_rank_by_severity():
    aizawl = [Point(reference=f"A{i}", latitude=23.736 + i * 0.002, longitude=92.72, severity=Severity.CRITICAL) for i in range(3)]
    barpeta = [Point(reference=f"B{i}", latitude=26.27 + i * 0.002, longitude=90.86, severity=Severity.MEDIUM) for i in range(4)]
    lone = [Point(reference="X", latitude=27.5, longitude=88.5)]
    r = hotspots.find(HotspotRequest(points=aizawl + barpeta + lone, radius_km=1.0, min_reports=3))
    assert len(r.hotspots) == 2
    assert r.hotspots[0].critical_count == 3  # three critical reports outrank four medium ones
    assert r.unclustered == 1
