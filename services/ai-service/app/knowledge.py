"""
What the assistant is allowed to rely on. The model answers from this, plus
the person's state and location, so it never invents a helpline number or a
shelter. Guidance follows standard NDMA public advice for each hazard.
"""

HELPLINES = {
    "112": "National emergency number (police, fire, ambulance)",
    "108": "Ambulance",
    "1070": "State disaster control room (State Emergency Operations Centre)",
    "1077": "District disaster control room (District Emergency Operations Centre)",
}

STATES = {
    "AR": "Arunachal Pradesh", "AS": "Assam", "MN": "Manipur", "ML": "Meghalaya",
    "MZ": "Mizoram", "NL": "Nagaland", "SK": "Sikkim", "TR": "Tripura",
}

GUIDES = {
    "flood": {
        "do": [
            "Move to higher ground or an upper floor.",
            "Keep drinking water, dry food, medicines, a torch and documents in a waterproof bag.",
            "Save phone battery: lower brightness, close other apps, keep calls short.",
            "Follow official warnings on radio, TV and from the district administration.",
            "Stay visible to rescue teams: wave bright cloth by day, use a torch at night.",
            "Switch off electricity at the main switch if water is entering the house and it is safe to reach.",
        ],
        "dont": [
            "Do not walk or drive through floodwater. Just 15 cm of moving water can knock you down.",
            "Do not touch electric poles, wires or switches if you are wet or standing in water.",
            "Do not enter fast-moving water, even to save belongings.",
            "Do not ignore evacuation orders. Leave early, not when water reaches your door.",
            "Do not drink floodwater. Boil it or use purification tablets.",
        ],
    },
    "landslide": {
        "do": [
            "Watch for warning signs: new cracks in the ground or walls, tilting trees or poles, sudden muddy water in streams, rumbling sounds.",
            "Move out of the path of a slide, sideways rather than downhill, to stable higher ground.",
            "During heavy rain stay alert, even at night, and keep away from steep slopes and stream banks.",
            "If the road is blocked, wait for clearance teams and report slides to the authorities.",
            "If trapped, protect your head, tap on a pipe or wall so rescuers can hear you, and save phone battery.",
        ],
        "dont": [
            "Do not stay below steep slopes or near drainage channels during heavy rain.",
            "Do not cross a slide area or a swollen stream. More debris can follow.",
            "Do not return to a slide area until officials say it is safe.",
            "Do not drive on hill roads during heavy rain unless you must.",
            "Do not shout continuously if trapped. It wastes energy and makes you breathe in dust.",
        ],
    },
    "earthquake": {
        "do": [
            "Drop, Cover and Hold On: get under a sturdy table and hold on until the shaking stops.",
            "If outdoors, move to an open area away from buildings, trees, poles and wires.",
            "When the shaking stops, leave damaged buildings carefully and expect aftershocks.",
            "Check for injuries and gas leaks. Switch off electricity and gas if you can.",
            "If trapped under debris, cover your mouth and tap on a pipe or wall so rescuers can hear you.",
        ],
        "dont": [
            "Do not run outside while the ground is shaking.",
            "Do not use lifts.",
            "Do not stand near windows, glass, heavy furniture or outside walls.",
            "Do not light matches or lighters. There may be a gas leak.",
            "Do not go back into damaged buildings.",
        ],
    },
    "first_aid": {
        "do": [
            "Bleeding: press firmly on the wound with a clean cloth and keep pressing; raise the limb if possible.",
            "Snake bite: keep the person still and calm, keep the bitten limb still, remove rings and tight items, and get them to a hospital quickly (call 108).",
            "Electric shock: do not touch the person until the power is off or you can push them away with dry wood or plastic.",
            "Unconscious but breathing: lay them on their side so they do not choke.",
            "Hypothermia after being in water: remove wet clothes, wrap in dry blankets, give warm (not hot) drinks if conscious.",
        ],
        "dont": [
            "Do not cut or suck a snake bite, and do not tie a tight tourniquet.",
            "Do not give food or water to an unconscious person.",
            "Do not move someone with a possible neck or back injury unless they are in danger where they are.",
        ],
    },
}

# Sample shelter data for the demo; in production this comes from info-service.
SHELTERS = [
    ("AS", "Barpeta Town HS School Relief Camp", "Barpeta", 26.3226, 91.0063, 600, "food, water, medical, phone charging"),
    ("AS", "Morigaon College Relief Camp", "Morigaon", 26.2530, 92.3421, 500, "food, water, medical"),
    ("AS", "Dhemaji Govt. Boys HS School", "Dhemaji", 27.4810, 94.5780, 450, "food, water, medical"),
    ("AS", "Sarusajai Indoor Stadium", "Kamrup Metro", 26.1360, 91.7710, 1200, "food, water, medical, phone charging"),
    ("AS", "Silchar Normal School Camp", "Cachar", 24.8270, 92.7980, 400, "food, water"),
    ("MZ", "Aizawl Vanapa Hall Relief Centre", "Aizawl", 23.7290, 92.7190, 350, "food, water, medical, phone charging"),
    ("MZ", "Lunglei Community Hall", "Lunglei", 22.8840, 92.7340, 200, "food, water"),
    ("ML", "Shillong Polo Ground Shelter", "East Khasi Hills", 25.5860, 91.8890, 700, "food, water, medical, phone charging"),
    ("ML", "Tura Govt. HS School Camp", "West Garo Hills", 25.5140, 90.2200, 300, "food, water"),
    ("MN", "Imphal Khuman Lampak Relief Camp", "Imphal East", 24.8150, 93.9500, 900, "food, water, medical, phone charging"),
    ("MN", "Noney Block Office Shelter", "Noney", 24.8530, 93.6220, 150, "food, medical"),
    ("SK", "Mangan Community Hall", "Mangan", 27.5100, 88.5300, 180, "food, water, phone charging"),
    ("SK", "Gangtok Paljor Stadium Shelter", "Gangtok", 27.3280, 88.6120, 600, "food, water, medical, phone charging"),
    ("AR", "Itanagar IG Park Relief Camp", "Itanagar Capital Complex", 27.0844, 93.6053, 400, "food, water, medical"),
    ("AR", "Pasighat Govt. College Camp", "East Siang", 28.0660, 95.3260, 300, "food, water"),
    ("NL", "Kohima Local Ground Shelter", "Kohima", 25.6700, 94.1080, 400, "food, water, medical"),
    ("NL", "Dimapur Town Hall Camp", "Dimapur", 25.9060, 93.7270, 500, "food, water, phone charging"),
    ("TR", "Agartala Umakanta Academy Camp", "West Tripura", 23.8360, 91.2800, 650, "food, water, medical, phone charging"),
    ("TR", "Udaipur Town Hall Shelter", "Gomati", 23.5330, 91.4870, 250, "food, water"),
]


def guides_text() -> str:
    parts = []
    for hazard, g in GUIDES.items():
        parts.append(f"## {hazard.replace('_', ' ').title()}\nDo:\n" + "\n".join(f"- {x}" for x in g["do"])
                     + "\nDon't:\n" + "\n".join(f"- {x}" for x in g["dont"]))
    return "\n\n".join(parts)


def helplines_text() -> str:
    return "\n".join(f"- {n}: {d}" for n, d in HELPLINES.items())
