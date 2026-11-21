"""
Loads a realistic demo scenario for North East India: SOS reports from all
eight states covering floods, landslides, an earthquake and flash floods, in
several languages, at every stage of the workflow.

Submissions go straight to sos-service (the gateway's per-network SOS rate
limit would otherwise block a bulk load); every officer action goes through
the gateway with a real staff login, exactly as the control room does it.

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

# Teams outside Assam. Registered if missing, so older databases get them too.
TEAMS = [
    ("NDRF-12BN-A", "NDRF 12th Bn, Alpha", "NDRF", "Papum Pare", "Insp. T. Riba", "9436000111", 18, 2, 27.1800, 93.7500),
    ("SDRF-AZL-01", "Mizoram SDRF Aizawl", "SDRF", "Aizawl", "SI Lalthanzuala", "9436000112", 12, 0, 23.7271, 92.7176),
    ("SDRF-SHL-01", "Meghalaya SDRF Shillong", "SDRF", "East Khasi Hills", "SI B. Lyngdoh", "9436000113", 12, 1, 25.5788, 91.8933),
    ("FES-TUR-01", "Fire & Emergency Tura", "FIRE_AND_EMERGENCY", "West Garo Hills", "Stn. Officer R. Sangma", "9436000114", 8, 2, 25.5138, 90.2036),
    ("SDRF-IMP-01", "Manipur SDRF Imphal", "SDRF", "Imphal West", "SI K. Singh", "9436000115", 14, 1, 24.8170, 93.9368),
    ("SDRF-GTK-01", "Sikkim SDRF Gangtok", "SDRF", "Gangtok", "SI P. Lepcha", "9436000116", 10, 0, 27.3314, 88.6138),
    ("VOL-MNG-01", "Mangan Rescue Volunteers", "VOLUNTEER", "Mangan", "D. Bhutia", "9436000117", 15, 0, 27.5080, 88.5290),
    ("SDRF-KOH-01", "Nagaland SDRF Kohima", "SDRF", "Kohima", "SI V. Angami", "9436000118", 12, 0, 25.6751, 94.1086),
    ("SDRF-AGT-01", "Tripura SDRF Agartala", "SDRF", "West Tripura", "SI S. Debbarma", "9436000119", 14, 3, 23.8315, 91.2868),
]

# (name, phone, district, lat, lng, category, people, language, text, minutes_offline)
REPORTS = [
    # --- Assam: Brahmaputra floods. Baghbor, Barpeta is a cluster -> hotspot.
    ("Rafiqul Islam", "9101000001", "Barpeta", 26.2702, 90.8641, "TRAPPED_IN_WATER", 6, "bn",
     "আমরা ৬ জন ছাদে আছি, পানি বাড়ছে, বাচ্চা আছে দুইজন। বাঘবর হাইস্কুলের পাশে", 0),
    ("Hasina Begum", "9101000002", "Barpeta", 26.2731, 90.8668, "MEDICAL", 3, "bn",
     "আমার শাশুড়ির বুকে ব্যথা, ঘরে কোমর পর্যন্ত পানি, নৌকা দরকার", 0),
    ("Dipankar Nath", "9101000003", "Barpeta", 26.2689, 90.8702, "TRAPPED_IN_WATER", 4, "as",
     "পানী চালৰ ওচৰ পাইছেহি, আমি ৪ জন চালত আছো। বাঘবৰ বজাৰৰ পিছফালে", 25),
    ("Mridul Das", "9101000005", "Barpeta", 26.2744, 90.8650, "VULNERABLE_PERSON", 2, "as",
     "মোৰ মা শয্যাশায়ী, খোজ কাঢ়িব নোৱাৰে। ঘৰত আঁঠুলৈকে পানী, বাঢ়িছে", 0),
    # Same family as Rafiqul, reported by a relative: flagged as a duplicate.
    ("Salma Khatun", "9101000006", "Barpeta", 26.2705, 90.8644, "TRAPPED_IN_WATER", 6, "bn",
     "আমার ভাইয়ের পরিবার ৬ জন ছাদে আছে, পানি বাড়ছে, দুইটা বাচ্চা। বাঘবর হাইস্কুলের পাশে", 0),
    ("Jitumoni Bordoloi", "9101000007", "Morigaon", 26.3402, 92.3810, "TRAPPED_IN_WATER", 5, "as",
     "বান্ধ ভাঙিছে, পানী খৰকৈ সোমাইছে। আমি ৫ জন, এজন কেঁচুৱা আছে। লাহৰীঘাট নামঘৰৰ ওচৰত", 0),
    ("Bimal Pegu", "9101000010", "Dhemaji", 27.7811, 95.2302, "TRAPPED_IN_WATER", 7, "en",
     "Water at chest level and rising fast, 7 of us including two old people on the roof of the school near Jonai market", 0),
    ("Bhaben Payeng", "9101000015", "Majuli", 26.9530, 94.1710, "TRAPPED_IN_WATER", 8, "as",
     "গাঁওখন সম্পূৰ্ণ পানীত ডুবিছে, ৮ জন মানুহ নাওৰ অপেক্ষাত। গড়মূৰ সত্ৰৰ ওচৰত", 15),
    ("Riya Sharma", "9101000016", "Kamrup Metro", 26.1731, 91.7688, "TRAPPED_IN_WATER", 3, "hi",
     "अनिल नगर में घर के अंदर कमर तक पानी, बुज़ुर्ग दादी हैं, बिजली नहीं है", 0),
    ("Hemanta Bora", "9101000014", "Lakhimpur", 26.9512, 93.8622, "OTHER", 3, "en",
     "Electric pole fell into the water next to our house, wires are live. 3 people inside, cannot leave.", 0),
    ("Test User", "9101000021", "Nagaon", 26.1602, 92.6411, "OTHER", 1, "en", "testing app hello", 0),

    # --- Mizoram: landslides around Aizawl -> hotspot.
    ("Lalremruati", "9101000031", "Aizawl", 23.7380, 92.7230, "LANDSLIDE", 4, "en",
     "Landslide behind our building in Ramhlun North. The back wall collapsed and my uncle is trapped under the debris. Heavy rain still falling.", 0),
    ("Vanlalhruaia", "9101000032", "Aizawl", 23.7412, 92.7262, "LANDSLIDE", 6, "en",
     "Big cracks opened in the road above our houses at Zemabawk and mud is sliding slowly. 6 of us still inside, we want to get out.", 0),
    ("Rosangpuii", "9101000033", "Aizawl", 23.7355, 92.7201, "LANDSLIDE", 3, "en",
     "Road to our colony blocked by landslide. 3 elderly people need their medicines, everyone else is safe.", 20),

    # --- Meghalaya
    ("Bashan Kharkongor", "9101000034", "East Khasi Hills", 25.5925, 91.8740, "LANDSLIDE", 5, "en",
     "Landslide near Mawlai, two houses damaged, a child is injured and bleeding from the head, road blocked.", 0),
    ("Sengchi Marak", "9101000035", "West Garo Hills", 25.5110, 90.2210, "TRAPPED_IN_WATER", 4, "en",
     "Flash flood in Tura, water came into our house up to waist level in minutes. 4 of us including a baby.", 0),

    # --- Manipur
    ("Thangjam Ibomcha", "9101000036", "Noney", 24.8530, 93.6220, "LANDSLIDE", 8, "en",
     "Massive landslide hit the construction camp near Tupul. Workers are buried, we can hear people calling from under the mud.", 0),
    ("Priya Devi", "9101000037", "Imphal West", 24.8090, 93.9300, "EARTHQUAKE", 3, "hi",
     "भूकंप से घर की दीवार गिर गई, मेरी माँ के पैर में चोट है, हम बाहर आ गए हैं", 0),

    # --- Sikkim
    ("Karma Bhutia", "9101000038", "Mangan", 27.5050, 88.5310, "LANDSLIDE", 12, "en",
     "Landslide has cut the North Sikkim highway near Mangan. 12 tourists stranded in our homestay, food for one day only. All safe for now.", 0),

    # --- Arunachal Pradesh
    ("Tage Tama", "9101000039", "Papum Pare", 27.1000, 93.6200, "LANDSLIDE", 2, "hi",
     "भूस्खलन से हमारा घर दब गया, मेरे पिता मलबे में फँसे हैं, जल्दी मदद भेजें", 0),

    # --- Nagaland
    ("Neikedolie", "9101000040", "Kohima", 25.6650, 94.1050, "LANDSLIDE", 5, "en",
     "Mud is sliding onto the road near our house in Kohima and the walls are cracking. 5 of us want to evacuate.", 0),

    # --- Tripura
    ("Sumana Debnath", "9101000041", "West Tripura", 23.8400, 91.2900, "TRAPPED_IN_WATER", 6, "bn",
     "আগরতলায় ঘরে বুক সমান জল, ৬ জন আটকে আছি, বাচ্চা আছে, জল বাড়ছে", 0),
    ("Ratan Jamatia", "9101000042", "Gomati", 23.5330, 91.4870, "FOOD_AND_WATER", 15, "bn",
     "১৫ জন স্কুলে আশ্রয় নিয়েছি, খাবার আর খাওয়ার জল নেই, সবাই নিরাপদ", 30),

    # --- Moved through the workflow below
    ("Gautam Deka", "9101000022", "Barpeta", 26.3301, 91.0102, "TRAPPED_IN_WATER", 5, "as",
     "আমি ৫ জন দুমহলাত আছো, তলৰ মহলা ডুবিছে। বৰপেটা নগৰৰ পশ্চিমে", 0),
    ("Farida Ahmed", "9101000023", "Morigaon", 26.2531, 92.0301, "VULNERABLE_PERSON", 3, "en",
     "Elderly couple and their disabled son stranded near Mayong, water at knee level.", 0),
    ("Lakhyajit Sonowal", "9101000024", "Dhemaji", 27.4302, 94.3511, "TRAPPED_IN_WATER", 4, "as",
     "গোগামুখত ঘৰ ডুবিছে, ৪ জন গছত উঠি আছো", 0),
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
    token = call(GATEWAY, "POST", "/api/auth/login", {"username": "admin", "password": "Flood@2026"})["token"]

    existing = {t["code"] for t in call(GATEWAY, "GET", "/api/teams", token=token)}
    added = 0
    for code, name, kind, district, leader, phone, members, boats, lat, lng in TEAMS:
        if code in existing:
            continue
        call(GATEWAY, "POST", "/api/teams", {
            "code": code, "name": name, "type": kind, "district": district, "leaderName": leader, "phone": phone,
            "members": members, "boats": boats, "baseLatitude": lat, "baseLongitude": lng}, token)
        added += 1
    print(f"Rescue teams: {len(existing) + added} ({added} added)")

    # With a free-tier AI key, triage calls are rate-limited; pace submissions so every
    # report gets an AI triage instead of falling back to the rule engine.
    try:
        engine = json.loads(urllib.request.urlopen("http://localhost:8083/actuator/health", timeout=5).read())["engine"]
    except Exception:  # noqa: BLE001
        engine = "rules"
    gap = 4.5 if engine != "rules" else 0.3
    print(f"AI triage engine: {engine}" + (" (pacing submissions for the free-tier rate limit)" if engine != "rules" else ""))

    now = datetime.now(timezone.utc)
    refs = {}
    print(f"Submitting {len(REPORTS)} SOS reports from across the North East…")
    for name, phone, district, lat, lng, cat, people, lang, text, offline_min in REPORTS:
        body = {
            "clientRequestId": str(uuid.uuid4()), "name": name, "phone": phone, "category": cat,
            "peopleCount": people, "description": text, "latitude": lat, "longitude": lng,
            "accuracyMeters": 15, "district": district, "language": lang,
            "channel": "QUEUED_SYNC" if offline_min else "DIRECT",
            "reportedAt": (now - timedelta(minutes=offline_min)).isoformat(),
        }
        refs[name] = call(SOS_SERVICE, "POST", "/api/sos", body)["reference"]
        time.sleep(gap)

    status = lambda ref, s, note: call(GATEWAY, "PATCH", f"/api/sos/{ref}/status",
                                       {"status": s, "note": note, "changedBy": "admin"}, token)

    def dispatch(ref):
        sos = call(GATEWAY, "GET", f"/api/sos/{ref}", token=token)
        team = call(GATEWAY, "GET", f"/api/teams/nearest?lat={sos['latitude']}&lng={sos['longitude']}&limit=1", token=token)[0]["team"]
        return call(GATEWAY, "POST", "/api/assignments", {"sosReference": ref, "teamId": team["id"], "assignedBy": "admin"}, token)

    print("Applying officer decisions…")
    for n in ["Gautam Deka", "Farida Ahmed", "Lakhyajit Sonowal", "Lalremruati", "Jitumoni Bordoloi",
              "Pankaj Medhi", "Bimal Pegu", "Karma Bhutia"]:
        status(refs[n], "VERIFIED", "Called back, details confirmed")

    op = dispatch(refs["Gautam Deka"])
    call(GATEWAY, "POST", f"/api/assignments/{op['id']}/complete", {"peopleRescued": 5, "note": "All moved to Barpeta Town HS camp", "by": "admin"}, token)
    op = dispatch(refs["Farida Ahmed"])
    call(GATEWAY, "POST", f"/api/assignments/{op['id']}/complete", {"peopleRescued": 3, "by": "admin"}, token)
    op = dispatch(refs["Lakhyajit Sonowal"])
    call(GATEWAY, "POST", f"/api/assignments/{op['id']}/depart", {"by": "admin"}, token)
    dispatch(refs["Lalremruati"])
    dispatch(refs["Jitumoni Bordoloi"])

    status(refs["Test User"], "REJECTED", "Test message, no emergency")

    time.sleep(3 if engine == "rules" else 10)  # let background triage finish
    salma = call(GATEWAY, "GET", f"/api/sos/{refs['Salma Khatun']}", token=token)
    dup_of = (salma.get("triage") or {}).get("possibleDuplicateOf")
    print(f"Duplicate check: {refs['Salma Khatun']} flagged as duplicate of {dup_of} (expected {refs['Rafiqul Islam']})")

    print("\nDone. Scenario across all 8 North East states:")
    print("  review queue  : floods (Assam, Tripura, Meghalaya), landslides (Mizoram, Manipur, Arunachal,")
    print("                  Nagaland, Meghalaya), an earthquake (Manipur), a duplicate, offline deliveries")
    print("  ready to send : Pankaj Medhi, Bimal Pegu, Karma Bhutia (Sikkim)")
    print("  active        : Lalremruati (Aizawl landslide), Jitumoni Bordoloi (assigned), Lakhyajit Sonowal (en route)")
    print("  closed        : 2 rescued, 1 rejected")


if __name__ == "__main__":
    main()
