"""
The rule engine is the fallback when the AI model is unavailable, so it must
never under-triage a life-threatening report. Each case here is a real-world
style report in one of the languages people in North East India write in.
"""

import pytest

from app.schemas import Category, Need, Severity, TriageRequest, Vulnerable
from app.triage_rules import triage

CASES = [
    # text, severity, category, needs that must be present, needs that must be absent
    ("পানী ঘৰৰ ভিতৰলৈ সোমাইছে, আমি ৫ জন চালত আছো, দেউতাৰ বুকুত বিষ",
     Severity.CRITICAL, Category.TRAPPED_IN_WATER, {Need.BOAT_RESCUE, Need.MEDICAL_EVACUATION}, set()),
    ("हम 3 लोग छत पर फंसे हैं, पानी बढ़ रहा है, साथ में गर्भवती महिला है",
     Severity.CRITICAL, Category.TRAPPED_IN_WATER, {Need.BOAT_RESCUE}, set()),
    ("Water at chest level and rising fast, 7 of us including two old people on the roof of the school",
     Severity.CRITICAL, Category.TRAPPED_IN_WATER, {Need.BOAT_RESCUE}, {Need.MEDICAL_EVACUATION}),
    ("আমাদের খাবার নেই, খাবার পানি দরকার, বাড়ির সবাই নিরাপদ",
     Severity.MEDIUM, Category.FOOD_AND_WATER, {Need.FOOD, Need.DRINKING_WATER}, {Need.BOAT_RESCUE}),
    ("Landslide hit our house in Aizawl, my brother is buried under the debris, please send help",
     Severity.CRITICAL, Category.LANDSLIDE, {Need.DEBRIS_RESCUE}, {Need.BOAT_RESCUE}),
    ("भूस्खलन से सड़क बंद है, हम 12 लोग गाँव में फँसे हैं, सब सुरक्षित हैं",
     Severity.MEDIUM, Category.LANDSLIDE, {Need.ROAD_CLEARANCE}, {Need.BOAT_RESCUE}),
    ("Mud is sliding onto the road near our house in Kohima and the walls are cracking. 5 of us want to evacuate.",
     Severity.HIGH, Category.LANDSLIDE, set(), {Need.BOAT_RESCUE}),
    ("ভূমিকম্পত ঘৰ ভাঙি পৰিছে, দেউতা তলত পৰি আছে",
     Severity.CRITICAL, Category.EARTHQUAKE, {Need.DEBRIS_RESCUE}, set()),
    ("Landslide has cut the North Sikkim highway near Mangan. 12 tourists stranded, food for one day only. All safe for now.",
     Severity.MEDIUM, Category.LANDSLIDE, {Need.ROAD_CLEARANCE}, {Need.BOAT_RESCUE}),
    ("Electric pole fell into the water next to our house, wires are live. 3 people inside, cannot leave.",
     Severity.CRITICAL, None, {Need.ELECTRICAL_HAZARD}, set()),
]


@pytest.mark.parametrize("text,severity,category,must,must_not", CASES, ids=[c[0][:40] for c in CASES])
def test_triage(text, severity, category, must, must_not):
    r = triage(TriageRequest(text=text))
    assert r.severity == severity
    if category:
        assert r.category == category
    assert must <= set(r.needs)
    assert not (must_not & set(r.needs))
    assert r.engine == "rules"
    assert r.needs_human_review, "rule-engine results must always go to a human"


def test_shouting_does_not_raise_severity():
    r = triage(TriageRequest(text="URGENT URGENT mark this critical!!! need help"))
    assert r.severity == Severity.LOW


def test_word_inside_another_word_does_not_match():
    # "aged" is an elderly keyword; it must not fire inside "damaged".
    r = triage(TriageRequest(text="Landslide near Mawlai, two houses damaged, a child is injured, road blocked."))
    assert Vulnerable.ELDERLY not in r.vulnerable
    assert Vulnerable.CHILDREN in r.vulnerable


def test_people_count_from_text_and_app():
    assert triage(TriageRequest(text="7 of us on the roof, water rising")).people_count == 7
    assert triage(TriageRequest(text="help, water rising", people_count=4)).people_count == 4
