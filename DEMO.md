# Demo script (2 minutes)

## Before you present

1. MySQL service running (it starts with Windows).
2. `powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1` and wait for **All up**.
3. `powershell -ExecutionPolicy Bypass -File scripts\reset-demo.ps1` for a clean scenario.
4. **Window 1, the citizen's phone:** Chrome, `http://localhost:5173`, DevTools open
   (F12), device toolbar on (Ctrl+Shift+M), pick a phone. Open the Network tab
   so the **No throttling / Offline** dropdown is one click away. Switch the
   app to **অসমীয়া**.
5. **Window 2, the control room:** `http://localhost:5174`, signed in as `admin` / `Flood@2026`.
6. Put the windows side by side. Open the Relief camps page once while online so
   the map tiles are cached.
7. Rehearse once. The live run below takes about 2 minutes.

## The run

**0:00. The problem (say it, don't show it)**
> "When the Brahmaputra floods, the people who most need help are the ones
> with one bar of 2G or none at all. Most SOS apps fail exactly then. Ours
> doesn't."

**0:15. Citizen goes offline**
- In DevTools, set the network to **Offline**. The app's badge turns to *অফলাইন*.
- Reload the page. **It still opens**, because the service worker serves it.
- Tap **SOS**. GPS fills in (GPS needs no internet).
- Pick *বানপানীত আবদ্ধ* (trapped by floodwater), 4 people, type a line in Assamese, for example
  `পানী চালৰ ওচৰ পাইছেহি, আমি ৪ জন চালত আছো`, and send.
> "No network, and the request is not lost. It's saved on the phone, and the
> screen tells the truth: saved, not yet received."

**0:45. The network comes back**
- Set DevTools back to **No throttling**.
- Within about a second the reference number appears, for example `AS-7K3Q9`.
> "It sent itself the moment a signal came back. If the phone retries ten
> times on a flaky network, the control room still sees one request."

**1:00. Control room**
- The new request is at the top of **Review**, marked **Critical**, with a
  **Delayed** tag showing it was sent late from an offline phone.
- Click it. Point at the **AI triage** card: severity, the reason, needs, water level.
> "The AI reads Assamese, Bengali and Hindi and turns it into something an
> officer can act on in two seconds. It only suggests; a person decides.
> If the AI service goes down, a rule engine takes over, so triage never stops."

**1:20. Verify and dispatch**
- Click **Verify request**. The nearest available teams appear with distances
  and a warning if a team has no boat.
- Click **Dispatch** on the first one.
- Look at the phone: it now shows **Rescue team assigned**.
> "The citizen sees every step, and never a promise we haven't kept."

**1:40. The bigger picture**
- On the map, point at the dashed **hotspot** around Baghbor.
- Click **Possible duplicate** on `Salma Khatun`'s request: it's the same
  family reported by a relative, linked automatically.
- KPI strip: open requests, critical, people rescued, all from live data.

**1:55. Close**
> "Four microservices, each with its own database, behind one gateway with role-based
> access. A phone app that works offline in three languages, and AI that
> degrades safely. Built for the worst network on the worst day."

## Likely questions

| Question | Answer |
|---|---|
| What if there's no network at all, ever? | The request waits on the phone and goes out the moment any signal returns, even briefly. An SMS fallback is built into the app and switches on once an SMS gateway number is configured. |
| How accurate is the AI? | It's advisory: the officer always decides, and unclear reports are pushed to the higher severity and flagged for review. Without the model, a multilingual rule engine still triages, and it's labelled as low confidence. |
| What stops fake reports? | Rate limiting per network, officer verification before any dispatch, a required reason for every rejection, and duplicate detection. |
| Privacy? | Citizens' status pages show no name, phone or location. Full details need a staff login (JWT with roles). |
| Does it scale? | Services are stateless and split by responsibility, each with its own database. The gateway is the only public entry point. |
| Why microservices for a hackathon? | Triage can fail or be slow without touching SOS intake. That isolation is the point in a disaster. |

## If something goes wrong on stage

- **Wi-Fi dies:** everything runs on localhost. Only fresh map tiles need the
  internet, and tiles you've already viewed are cached.
- **A service won't start:** `scripts\stop-all.ps1`, then `start-all.ps1`
  again. Logs are in `logs\`.
- **The data looks messy after rehearsals:** `scripts\reset-demo.ps1`.
- **Plan B:** record a screen capture of one clean run beforehand.
