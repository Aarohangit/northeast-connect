"""
Keyword triage. Used when Claude isn't configured or can't be reached.
Cruder than the model, but it never goes down, and it errs on the side of
a higher severity with human review switched on.
"""

import re

from .schemas import (Category, Confidence, Need, Severity, TriageRequest, TriageResult, Vulnerable,
                      WaterLevel)

# English, romanised Hindi/Assamese, Devanagari, and Assamese/Bengali script.
WORDS = {
    "trapped": ["trapped", "stuck", "stranded", "cannot get out", "can't get out", "phas", "fanse", "fase",
                "फंसे", "फँसे", "फंस", "আবদ্ধ", "আটকা", "আটক", "সোমাই আছো"],
    "roof": ["roof", "terrace", "chhat", "chaal", "छत", "চাল", "চালত", "ছাদ"],
    "rising": ["rising", "increasing", "coming in", "entering", "badh raha", "bad raha", "badh rahi",
               "बढ़ रहा", "बढ़ रही", "बढ़", "বাঢ়িছে", "সোমাইছে", "বাড়ছে", "ঢুকছে"],
    "swept": ["swept", "drowning", "washed away", "flowing away", "beh gaya", "doob", "बह गया", "डूब",
              "উটুৱাই", "ডুবি", "ভেসে"],
    # "chest" alone is not enough: "water at chest level" is a water depth, not a symptom.
    "chest": ["chest pain", "pain in chest", "pain in his chest", "pain in her chest", "chest ache", "heart attack",
              "heart problem", "seene mein dard", "सीने में दर्द", "छाती में दर्द", "दिल का दौरा", "বুকুত বিষ",
              "বুকত বিষ", "বুকে ব্যথা", "হৃদ"],
    "breath": ["breath", "breathing", "saans", "सांस", "साँस", "উশাহ", "শ্বাস"],
    "unconscious": ["unconscious", "fainted", "not responding", "behosh", "बेहोश", "অজ্ঞান"],
    "bleeding": ["bleeding", "blood", "khoon", "खून", "তেজ", "রক্ত"],
    "snake": ["snake", "saanp", "सांप", "साँप", "সাপ"],
    "electric": ["electric", "current", "shock", "wire", "बिजली", "করেণ্ট", "বিদ্যুৎ"],
    "labour": ["labour", "labor", "delivery", "contractions", "प्रसव", "প্ৰসৱ", "প্রসব"],
    "pregnant": ["pregnant", "garbhvati", "गर्भवती", "গৰ্ভৱতী", "গর্ভবতী"],
    "infant": ["infant", "newborn", "baby", "shishu", "नवजात", "কেঁচুৱা", "শিশু"],
    "children": ["child", "children", "kids", "bachche", "bacche", "baccha", "bachcha", "bachha", "bache",
                 "बच्चे", "बच्चा", "ল'ৰা-ছোৱালী", "লৰা-ছোৱালী", "সন্তান", "বাচ্চা"],
    "elderly": ["elderly", "old man", "old woman", "old people", "old person", "old couple", "grandmother", "grandfather", "grandma", "grandpa", "aged",
                "buzurg", "bujurg", "dadi", "dada", "nani", "nana", "aita", "koka", "बुजुर्ग", "दादी", "दादा",
                "नानी", "नाना", "বুঢ়া", "আইতা", "ককা", "বৃদ্ধ"],
    "disabled": ["disabled", "wheelchair", "bedridden", "paralysed", "paralyzed", "विकलांग", "বিকলাং", "শয্যাশায়ী"],
    "medicine": ["medicine", "insulin", "dialysis", "tablet", "dawai", "दवा", "दवाई", "ঔষধ", "দৰব"],
    "fever": ["fever", "bukhar", "बुखार", "জ্বৰ", "জ্বর"],
    "injury": ["injured", "injury", "broken", "fracture", "wound", "chot", "चोट", "আঘাত"],
    "food": ["food", "hungry", "rice", "khana", "खाना", "भोजन", "খাদ্য", "খোৱা", "খাবার", "ভাত"],
    "drinking": ["drinking water", "clean water", "no water to drink", "peene ka pani", "पीने का पानी",
                 "খোৱাপানী", "খাবার পানি"],
    "shelter": ["shelter", "nowhere to go", "house collapsed", "ghar gir", "घर गिर", "আশ্ৰয়", "আশ্রয়"],
    "collapse": ["collapse", "collapsing", "embankment", "breach", "dyke", "गिर रहा", "বান্ধ", "ভাঙি"],
    "landslide": ["landslide", "land slide", "mudslide", "mud slide", "mud is sliding", "mud sliding", "sliding",
                  "hill collapsed", "slope", "bhooskhalan",
                  "bhuskhalan", "भूस्खलन", "पहाड़ धंस", "पहाड़ गिर", "ভূমিস্খলন", "ভূমিস্খলন", "মাটি খহি", "পাহাৰ খহি",
                  "ধস", "ধ্বস", "পাহাড় ধসে"],
    "earthquake": ["earthquake", "quake", "tremor", "bhukamp", "bhookamp", "भूकंप", "भूकम्प", "ভূমিকম্প", "ভূমিকম্প"],
    "buried": ["buried", "under debris", "under the debris", "trapped under", "under rubble", "rubble", "debris",
               "मलबे", "मलबा", "दबे", "दब गए", "দবি", "তলত পৰি", "চাপা পড়", "ধ্বংসস্তূপ"],
    "building_down": ["house collapsed", "building collapsed", "wall collapsed", "roof collapsed", "house fell",
                      "मकान गिर", "घर गिर", "दीवार गिर", "ঘৰ ভাঙি", "ঘৰ খহি", "বাড়ি ভেঙে", "দেওয়াল ভেঙে"],
    "cracks": ["crack", "cracks", "cracking", "दरार", "ফাট", "ফাটল"],
    "safe": ["all safe", "everyone safe", "everyone is safe", "we are safe", "safe for now", "सब सुरक्षित",
             "सुरक्षित हैं", "সকলো সুৰক্ষিত", "সুৰক্ষিত আছো", "সবাই নিরাপদ", "নিরাপদ আছি"],
    "water_words": ["water", "flood", "pani", "paani", "पानी", "बाढ़", "পানী", "বান", "পানি", "বন্যা", "জল"],
    "evacuate": ["evacuate", "evacuation", "want to get out", "need to get out", "निकलना है", "निकालो",
                 "ওলাই যাব লাগে", "বের হতে"],
    "road_blocked": ["road blocked", "road is blocked", "road cut off", "road washed", "cut off", "no road",
                     "highway cut", "cut the highway", "highway blocked", "highway near", "cut the",
                     "रास्ता बंद", "सड़क बंद", "সড়ক বন্ধ", "ৰাস্তা বন্ধ", "বাট বন্ধ", "রাস্তা বন্ধ"],
}

# Being on the roof is not the same as water at roof level, so ROOF needs explicit wording.
WATER_LEVELS = [
    (WaterLevel.ROOF, ["water at roof", "water on roof", "roof level", "over the roof", "छत तक", "চাললৈ", "ছাদ পর্যন্ত"]),
    (WaterLevel.CHEST, ["chest", "neck", "छाती", "গলা", "বুকুলৈ", "বুক পর্যন্ত"]),
    (WaterLevel.WAIST, ["waist", "kamar", "कमर", "কঁকাল", "কোমর"]),
    (WaterLevel.KNEE, ["knee", "ghutne", "घुटने", "আঁঠু", "হাঁটু"]),
    (WaterLevel.ANKLE, ["ankle", "टखने", "গোৰোহা", "গোড়ালি"]),
]

NUMBER_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8,
                "nine": 9, "ten": 10}


def _match(text: str, word: str) -> bool:
    # Latin-script keywords must start a word ("aged" must not match "damaged"); they may still be
    # stems ("trap" matches "trapped"). Indic-script keywords are matched anywhere, since words
    # there are often joined with suffixes and particles.
    if word.isascii():
        return re.search(r"(?<![a-z])" + re.escape(word), text) is not None
    return word in text


def _has(text: str, key: str) -> bool:
    return any(_match(text, w) for w in WORDS[key])


def _people(text: str) -> int:
    m = re.search(r"(\d{1,3})\s*(people|persons|members|log|jan|জন|জনী|लोग|জন মানুহ)", text)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d{1,3})\s+of\s+us", text)
    if m:
        return int(m.group(1))
    m = re.search(r"\b(" + "|".join(NUMBER_WORDS) + r")\s+(people|persons|members|of us)", text)
    return NUMBER_WORDS[m.group(1)] if m else 0


def triage(req: TriageRequest) -> TriageResult:
    t = req.text.lower()

    vulnerable: list[Vulnerable] = []
    if _has(t, "infant"):
        vulnerable.append(Vulnerable.INFANT)
    if _has(t, "children"):
        vulnerable.append(Vulnerable.CHILDREN)
    if _has(t, "elderly"):
        vulnerable.append(Vulnerable.ELDERLY)
    if _has(t, "pregnant") or _has(t, "labour"):
        vulnerable.append(Vulnerable.PREGNANT)
    if _has(t, "disabled"):
        vulnerable.append(Vulnerable.DISABLED)

    medical: list[str] = []
    for key, label in [("chest", "chest pain"), ("breath", "breathing difficulty"),
                       ("unconscious", "unconscious"), ("bleeding", "bleeding"), ("snake", "snake bite"),
                       ("labour", "in labour"), ("fever", "fever"), ("injury", "injury"),
                       ("electric", "electrical hazard")]:
        if _has(t, key):
            medical.append(label)
    if medical and Vulnerable.SICK not in vulnerable and not set(medical) <= {"electrical hazard"}:
        vulnerable.append(Vulnerable.SICK)

    water = WaterLevel.NOT_MENTIONED
    for level, words in WATER_LEVELS:
        if any(w in t for w in words):
            water = level
            break
    rising = _has(t, "rising")

    life_threat = (
        _has(t, "swept") or _has(t, "unconscious") or _has(t, "chest") or _has(t, "breath")
        or _has(t, "bleeding") or _has(t, "snake") or _has(t, "labour") or _has(t, "electric")
        or _has(t, "collapse") or (water in (WaterLevel.CHEST, WaterLevel.ROOF) and rising)
        or (_has(t, "roof") and rising)
        or _has(t, "buried") or _has(t, "building_down")
    )
    urgent = (
        _has(t, "trapped") or _has(t, "roof") or water in (WaterLevel.WAIST, WaterLevel.CHEST, WaterLevel.ROOF)
        or _has(t, "injury") or _has(t, "medicine") or bool(vulnerable)
        or (_has(t, "cracks") and (_has(t, "landslide") or _has(t, "earthquake")))
        or _has(t, "evacuate")
    ) and not _has(t, "safe")
    supplies = _has(t, "food") or _has(t, "drinking") or _has(t, "shelter") or _has(t, "road_blocked")

    if life_threat:
        severity, reason = Severity.CRITICAL, "Report mentions an immediate threat to life"
    elif (_has(t, "landslide") or _has(t, "earthquake")) and not _has(t, "safe"):
        severity, reason = Severity.HIGH, "Landslide or earthquake affecting people"
    elif _has(t, "safe") and (supplies or _has(t, "landslide") or _has(t, "earthquake")):
        severity, reason = Severity.MEDIUM, "Cut off or short of supplies, but reported safe"
    elif urgent:
        severity, reason = Severity.HIGH, "People stranded, injured or vulnerable"
    elif supplies:
        severity, reason = Severity.MEDIUM, "Essential supplies needed"
    else:
        severity, reason = Severity.LOW, "No specific need identified"

    needs: list[Need] = []
    debris = _has(t, "buried") or _has(t, "building_down")
    if debris:
        needs.append(Need.DEBRIS_RESCUE)
    # Being cut off by a landslide is not a job for a boat; only suggest one when water is involved.
    watery = _has(t, "water_words") or _has(t, "swept") or water != WaterLevel.NOT_MENTIONED
    if not debris and watery and (_has(t, "trapped") or _has(t, "roof") or _has(t, "swept") or water != WaterLevel.NOT_MENTIONED):
        needs.append(Need.BOAT_RESCUE)
    if _has(t, "road_blocked"):
        needs.append(Need.ROAD_CLEARANCE)
    if any(m in medical for m in ("chest pain", "breathing difficulty", "unconscious", "snake bite", "in labour")):
        needs.append(Need.MEDICAL_EVACUATION)
    if any(m in medical for m in ("bleeding", "injury")):
        needs.append(Need.FIRST_AID)
    if _has(t, "medicine") or "fever" in medical:
        needs.append(Need.MEDICINE)
    if _has(t, "food"):
        needs.append(Need.FOOD)
    if _has(t, "drinking"):
        needs.append(Need.DRINKING_WATER)
    if _has(t, "shelter"):
        needs.append(Need.SHELTER)
    if Vulnerable.INFANT in vulnerable:
        needs.append(Need.BABY_SUPPLIES)
    if _has(t, "electric"):
        needs.append(Need.ELECTRICAL_HAZARD)

    if _has(t, "landslide"):
        category = Category.LANDSLIDE
    elif _has(t, "earthquake"):
        category = Category.EARTHQUAKE
    elif Need.BOAT_RESCUE in needs:
        category = Category.TRAPPED_IN_WATER
    elif medical:
        category = Category.MEDICAL
    elif Vulnerable.CHILDREN in vulnerable or Vulnerable.INFANT in vulnerable:
        category = Category.CHILDREN
    elif vulnerable:
        category = Category.VULNERABLE_PERSON
    elif supplies:
        category = Category.FOOD_AND_WATER
    else:
        category = req.category or Category.OTHER

    people = _people(t) or (req.people_count or 0)

    bits = []
    if people:
        bits.append(f"{people} people")
    if _has(t, "landslide"):
        bits.append("landslide")
    if _has(t, "earthquake"):
        bits.append("earthquake")
    if debris:
        bits.append("people under debris" if _has(t, "buried") else "building collapsed")
    if _has(t, "roof"):
        bits.append("on roof")
    if _has(t, "road_blocked"):
        bits.append("road blocked")
    if _has(t, "cracks"):
        bits.append("cracks appearing")
    if water != WaterLevel.NOT_MENTIONED:
        bits.append(f"water at {water.value.lower()} level" + (", rising" if rising else ""))
    elif rising:
        bits.append("water rising")
    bits += medical[:2]
    bits += [v.value.lower() for v in vulnerable if v != Vulnerable.SICK][:2]
    summary = ", ".join(bits) if bits else req.text.strip()[:120]

    return TriageResult(
        category=category,
        severity=severity,
        severity_reason=reason,
        summary=summary[:1].upper() + summary[1:],
        translation=req.text,
        detected_language=req.language or "unknown",
        people_count=people,
        vulnerable=vulnerable,
        medical_conditions=medical,
        needs=needs,
        location_hints=[],
        water_level=water,
        water_rising=rising,
        confidence=Confidence.LOW,
        needs_human_review=True,
        engine="rules",
    )
