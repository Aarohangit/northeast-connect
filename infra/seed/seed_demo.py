"""
Loads a realistic demo scenario: SOS reports across flood-hit Assam districts,
in several languages, at every stage of the workflow.

Submissions go straight to sos-service (the gateway's per-network SOS rate
limit would otherwise block a bulk load); every officer action goes through
the gateway with a real staff login, exactly as the admin console does it.

    python infra/seed/seed_demo.py
"""

import json
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

SOS_SERVICE = "http://localhost:8081"
GATEWAY = "http://localhost:8090"

# (name, phone, district, lat, lng, category, people, language, text, minutes_offline)
REPORTS = [
    # Baghbor, Barpeta: a cluster that should show up as a hotspot
    ("Rafiqul Islam", "9101000001", "Barpeta", 26.2702, 90.8641, "TRAPPED_IN_WATER", 6, "bn",
     "আমরা ৬ জন ছাদে আছি, পানি বাড়ছে, বাচ্চা আছে দুইজন। বাঘবর হাইস্কুলের পাশে", 0),
    ("Hasina Begum", "9101000002", "Barpeta", 26.2731, 90.8668, "MEDICAL", 3, "bn",
     "আমার শাশুড়ির বুকে ব্যথা, ঘরে কোমর পর্যন্ত পানি, নৌকা দরকার", 0),
    ("Dipankar Nath", "9101000003", "Barpeta", 26.2689, 90.8702, "TRAPPED_IN_WATER", 4, "as",
     "পানী চালৰ ওচৰ পাইছেহি, আমি ৪ জন চালত আছো। বাঘবৰ বজাৰৰ পিছফালে", 25),
    ("Anowar Hussain", "9101000004", "Barpeta", 26.2715, 90.8619, "FOOD_AND_WATER", 9, "en",
     "9 people in the madrassa building since yesterday, no food and no drinking water. Everyone safe for now.", 0),
    ("Mridul Das", "9101000005", "Barpeta", 26.2744, 90.8650, "VULNERABLE_PERSON", 2, "as",
     "মোৰ মা শয্যাশায়ী, খোজ কাঢ়িব নোৱাৰে। ঘৰত আঁঠুলৈকে পানী, বাঢ়িছে", 0),
    # Same family as Rafiqul, reported by a relative: should be flagged as a duplicate
    ("Salma Khatun", "9101000006", "Barpeta", 26.2705, 90.8644, "TRAPPED_IN_WATER", 6, "bn",
     "আমার ভাইয়ের পরিবার ৬ জন ছাদে আছে, পানি বাড়ছে, দুইটা বাচ্চা। বাঘবর হাইস্কুলের পাশে", 0),

    # Laharighat, Morigaon
    ("Jitumoni Bordoloi", "9101000007", "Morigaon", 26.3402, 92.3810, "TRAPPED_IN_WATER", 5, "as",
     "বান্ধ ভাঙিছে, পানী খৰকৈ সোমাইছে। আমি ৫ জন, এজন কেঁচুৱা আছে। লাহৰীঘাট নামঘৰৰ ওচৰত", 0),
    ("Abdul Mazid", "9101000008", "Morigaon", 26.3431, 92.3842, "MEDICAL", 1, "hi",
     "मेरे पिता को साँप ने काटा है, यहाँ से अस्पताल जाने का रास्ता डूब गया है", 0),
    ("Pranjal Saikia", "9101000009", "Morigaon", 26.3378, 92.3791, "FOOD_AND_WATER", 14, "en",
     "14 families on the embankment near Laharighat. Need drinking water and rice. Some children have fever.", 40),

    # Jonai, Dhemaji
    ("Bimal Pegu", "9101000010", "Dhemaji", 27.7811, 95.2302, "TRAPPED_IN_WATER", 7, "en",
     "Water at chest level and rising fast, 7 of us including two old people on the roof of the school near Jonai market", 0),
    ("Rumi Doley", "9101000011", "Dhemaji", 27.7842, 95.2331, "VULNERABLE_PERSON", 2, "as",
     "মোৰ ভনীয়েক গৰ্ভৱতী, প্ৰসৱৰ বিষ উঠিছে। ৰাস্তা পানীত ডুবি আছে", 0),
    ("Kamal Taid", "9101000012", "Dhemaji", 27.7795, 95.2280, "FOOD_AND_WATER", 6, "hi",
     "हम 6 लोग राहत शिविर तक नहीं पहुँच पाए, दो दिन से खाना नहीं मिला", 0),

    # Elsewhere
    ("Nirmali Gogoi", "9101000013", "Lakhimpur", 27.1802, 94.5011, "CHILDREN", 4, "as",
     "তিনিটা ল'ৰা-ছোৱালী আৰু মই অকলে আছো, ঘৰৰ ভিতৰত কঁকাললৈ পানী। ঢকুৱাখনা", 0),
    ("Hemanta Bora", "9101000014", "Lakhimpur", 26.9512, 93.8622, "OTHER", 3, "en",
     "Electric pole fell into the water next to our house, wires are live. 3 people inside, cannot leave.", 0),
    ("Bhaben Payeng", "9101000015", "Majuli", 26.9530, 94.1710, "TRAPPED_IN_WATER", 8, "as",
     "গাঁওখন সম্পূৰ্ণ পানীত ডুবিছে, ৮ জন মানুহ নাওৰ অপেক্ষাত। গড়মূৰ সত্ৰৰ ওচৰত", 15),
    ("Riya Sharma", "9101000016", "Kamrup Metro", 26.1731, 91.7688, "TRAPPED_IN_WATER", 3, "hi",
     "अनिल नगर में घर के अंदर कमर तक पानी, बुज़ुर्ग दादी हैं, बिजली नहीं है", 0),
    ("Arup Kalita", "9101000017", "Kamrup Metro", 26.1752, 91.7712, "MEDICAL", 1, "en",
     "My father needs dialysis tomorrow, our lane in Nabin Nagar is under water. Not an emergency right now but we need transport.", 0),
    ("Jahanara Bibi", "9101000018", "Dhubri", 25.9701, 89.8902, "TRAPPED_IN_WATER", 5, "bn",
     "চরে আটকা পড়েছি, ৫ জন, পানি বাড়ছে। দক্ষিণ শালমারা ঘাটের কাছে", 30),
    ("Sukanta Dey", "9101000019", "Cachar", 24.8205, 92.8003, "FOOD_AND_WATER", 4, "bn",
     "সিলচর শহরে তিন দিন ধরে জল জমে আছে, খাবার জল শেষ", 0),
    ("Moon Hazarika", "9101000020", "Nagaon", 26.2311, 92.5204, "MEDICAL", 2, "as",
     "দেউতাৰ জ্বৰ তিনিদিন ধৰি, ঔষধ শেষ। ৰহা চাৰিআলিৰ ওচৰত", 0),
    ("Test User", "9101000021", "Nagaon", 26.1602, 92.6411, "OTHER", 1, "en",
     "testing app hello", 0),

    # These get verified and dispatched below
    ("Gautam Deka", "9101000022", "Barpeta", 26.3301, 91.0102, "TRAPPED_IN_WATER", 5, "as",
     "আমি ৫ জন দুমহলাত আছো, তলৰ মহলা ডুবিছে। বৰপেটা নগৰৰ পশ্চিমে", 0),
    ("Farida Ahmed", "9101000023", "Morigaon", 26.2531, 92.0301, "VULNERABLE_PERSON", 3, "en",
     "Elderly couple and their disabled son stranded near Mayong, water at knee level.", 0),
    ("Lakhyajit Sonowal", "9101000024", "Dhemaji", 27.4302, 94.3511, "TRAPPED_IN_WATER", 4, "as",
     "গোগামুখত ঘৰ ডুবিছে, ৪ জন গছত উঠি আছো", 0),
    ("Rekha Boro", "9101000025", "Lakhimpur", 27.2350, 94.0990, "MEDICAL", 1, "hi",
     "मेरी बेटी के पैर में गहरी चोट है, खून बह रहा है, नाव चाहिए", 0),
    ("Pankaj Medhi", "9101000026", "Kamrup Metro", 26.1360, 91.7900, "FOOD_AND_WATER", 20, "en",
     "About 20 people in the community hall at Zoo Road, need drinking water and baby food.", 0),
]


def call(base, method, path, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(base + path, method=method, headers=headers,
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {path} -> {e.code}: {e.read().decode(errors='replace')[:200]}") from None


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    now = datetime.now(timezone.utc)
    refs = {}
    print(f"Submitting {len(REPORTS)} SOS reports…")
    for name, phone, district, lat, lng, cat, people, lang, text, offline_min in REPORTS:
        body = {
            "clientRequestId": str(uuid.uuid4()), "name": name, "phone": phone, "category": cat,
            "peopleCount": people, "description": text, "latitude": lat, "longitude": lng,
            "accuracyMeters": 15, "district": district, "language": lang,
            "channel": "QUEUED_SYNC" if offline_min else "DIRECT",
            "reportedAt": (now - timedelta(minutes=offline_min)).isoformat() if offline_min else now.isoformat(),
        }
        refs[name] = call(SOS_SERVICE, "POST", "/api/sos", body)["reference"]
        time.sleep(0.3)  # spread the timestamps a little, like real traffic

    token = call(GATEWAY, "POST", "/api/auth/login", {"username": "admin", "password": "Flood@2026"})["token"]
    status = lambda ref, s, note: call(GATEWAY, "PATCH", f"/api/sos/{ref}/status",
                                       {"status": s, "note": note, "changedBy": "admin"}, token)

    def dispatch(ref):
        sos = call(GATEWAY, "GET", f"/api/sos/{ref}", token=token)
        team = call(GATEWAY, "GET", f"/api/teams/nearest?lat={sos['latitude']}&lng={sos['longitude']}&limit=1", token=token)[0]["team"]
        return call(GATEWAY, "POST", "/api/assignments", {"sosReference": ref, "teamId": team["id"], "assignedBy": "admin"}, token)

    print("Applying officer decisions…")
    for n in ["Gautam Deka", "Farida Ahmed", "Lakhyajit Sonowal", "Rekha Boro", "Pankaj Medhi", "Jitumoni Bordoloi", "Bimal Pegu"]:
        status(refs[n], "VERIFIED", "Called back, details confirmed")

    op1 = dispatch(refs["Gautam Deka"])
    call(GATEWAY, "POST", f"/api/assignments/{op1['id']}/complete", {"peopleRescued": 5, "note": "All moved to Barpeta Town HS camp", "by": "admin"}, token)
    op2 = dispatch(refs["Farida Ahmed"])
    call(GATEWAY, "POST", f"/api/assignments/{op2['id']}/complete", {"peopleRescued": 3, "by": "admin"}, token)
    op3 = dispatch(refs["Lakhyajit Sonowal"])
    call(GATEWAY, "POST", f"/api/assignments/{op3['id']}/depart", {"by": "admin"}, token)
    dispatch(refs["Rekha Boro"])
    dispatch(refs["Jitumoni Bordoloi"])

    status(refs["Test User"], "REJECTED", "Test message, no emergency")

    # Give background triage a moment, then merge the duplicate the AI flagged.
    time.sleep(3)
    salma = call(GATEWAY, "GET", f"/api/sos/{refs['Salma Khatun']}", token=token)
    dup_of = (salma.get("triage") or {}).get("possibleDuplicateOf")
    print(f"Duplicate check: {refs['Salma Khatun']} flagged as duplicate of {dup_of} (expected {refs['Rafiqul Islam']})")

    print("\nDone. Scenario:")
    print("  review queue   : most reports, incl. a flagged duplicate and delayed offline deliveries")
    print("  ready to send  : Pankaj Medhi (Zoo Road), Bimal Pegu (Jonai, critical)")
    print("  active         : Rekha Boro, Jitumoni Bordoloi (assigned), Lakhyajit Sonowal (en route)")
    print("  closed         : 2 rescued, 1 rejected")


if __name__ == "__main__":
    main()
