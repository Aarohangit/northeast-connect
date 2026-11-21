from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Category(str, Enum):
    TRAPPED_IN_WATER = "TRAPPED_IN_WATER"
    LANDSLIDE = "LANDSLIDE"
    EARTHQUAKE = "EARTHQUAKE"
    MEDICAL = "MEDICAL"
    FOOD_AND_WATER = "FOOD_AND_WATER"
    VULNERABLE_PERSON = "VULNERABLE_PERSON"
    CHILDREN = "CHILDREN"
    OTHER = "OTHER"


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Vulnerable(str, Enum):
    INFANT = "INFANT"
    CHILDREN = "CHILDREN"
    ELDERLY = "ELDERLY"
    PREGNANT = "PREGNANT"
    DISABLED = "DISABLED"
    SICK = "SICK"


class Need(str, Enum):
    BOAT_RESCUE = "BOAT_RESCUE"
    DEBRIS_RESCUE = "DEBRIS_RESCUE"
    ROAD_CLEARANCE = "ROAD_CLEARANCE"
    MEDICAL_EVACUATION = "MEDICAL_EVACUATION"
    FIRST_AID = "FIRST_AID"
    MEDICINE = "MEDICINE"
    FOOD = "FOOD"
    DRINKING_WATER = "DRINKING_WATER"
    SHELTER = "SHELTER"
    BABY_SUPPLIES = "BABY_SUPPLIES"
    ELECTRICAL_HAZARD = "ELECTRICAL_HAZARD"


class WaterLevel(str, Enum):
    NOT_MENTIONED = "NOT_MENTIONED"
    ANKLE = "ANKLE"
    KNEE = "KNEE"
    WAIST = "WAIST"
    CHEST = "CHEST"
    ROOF = "ROOF"


class Confidence(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# ---- triage ----

class TriageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    category: Category | None = Field(None, description="What the citizen picked in the app, if anything")
    people_count: int | None = Field(None, ge=1, le=500)
    language: str | None = Field(None, max_length=8)


class TriageResult(BaseModel):
    category: Category
    severity: Severity
    severity_reason: str
    summary: str
    translation: str
    detected_language: str
    people_count: int
    vulnerable: list[Vulnerable]
    medical_conditions: list[str]
    needs: list[Need]
    location_hints: list[str]
    water_level: WaterLevel
    water_rising: bool
    confidence: Confidence
    needs_human_review: bool
    engine: str = Field(description="'claude' or 'rules'")


# ---- duplicates ----

class Report(BaseModel):
    reference: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    received_at: datetime
    phone: str | None = None
    category: Category | None = None
    description: str | None = None


class DuplicateRequest(BaseModel):
    report: Report
    candidates: list[Report] = Field(max_length=500)


class DuplicateMatch(BaseModel):
    reference: str
    score: float
    distance_m: int
    minutes_apart: int
    reasons: list[str]


class DuplicateResponse(BaseModel):
    likely_duplicate: bool
    matches: list[DuplicateMatch]


# ---- hotspots ----

class Point(BaseModel):
    reference: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    severity: Severity = Severity.MEDIUM


class HotspotRequest(BaseModel):
    points: list[Point] = Field(max_length=5000)
    radius_km: float = Field(1.0, gt=0, le=20)
    min_reports: int = Field(3, ge=2, le=50)


class Hotspot(BaseModel):
    center_latitude: float
    center_longitude: float
    radius_km: float
    report_count: int
    critical_count: int
    priority_score: float
    references: list[str]


class HotspotResponse(BaseModel):
    hotspots: list[Hotspot]
    unclustered: int
