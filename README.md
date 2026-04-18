## HarmonicaGuru

India's first AI-powered harmonica learning Progressive Web App built for sargam learners.

Learn harmonica with real-time pitch detection, Hindi AI feedback, and guided song practice.

---

## Live Demo

Try it here:  
https://kumarvmcshubham.github.io/harmonicaguru/

---

## What is HarmonicaGuru?

HarmonicaGuru is a browser-based harmonica learning app built specifically for Indian learners who understand sargam notation better than Western notes.

It listens to users play through the phone microphone, detects the note in real time, and provides guided practice along with personalised AI feedback in Hindi.

---

## Why I Built It

Most harmonica tutorials are designed around Western notation, while many Indian learners are more comfortable with Sa Re Ga Ma.

I built HarmonicaGuru to make harmonica learning intuitive for this audience and to solve a key problem: learners don’t know if they are playing the correct note while practicing.

The goal was simple. Turn passive learning into active feedback-driven practice.

---

## Current Features

- Google Sign In using Firebase Authentication  
- Harmonica type selector (10-hole diatonic and 24-hole chromatic Tower harmonica)  
- Full sargam practice (Sa Re Ga Ma Pa Dha Ni Sa)  
- 2-note, 3-note, and 4-note sliding group exercises  
- Real-time pitch detection using phone microphone  
- Instant feedback (correct / sloppy / miss)  
- Microphone signal quality indicator  
- Daily free practice timer  
- Guided “Happy Birthday” lesson split into sections  
- AI Ustaad: Hindi feedback powered by Groq (Llama 3.1)  
- Voice guidance in Hinglish and English  
- Admin dashboard for users, subscriptions, and unlock codes  
- Unlock code system for monetization (MVP)  

---

## How It Works

### 1. Audio Capture
The app uses the Web Audio API to capture harmonica sound directly from the user's microphone.

### 2. Pitch Detection
A custom YIN-based pitch detection flow estimates the played frequency and maps it to the nearest sargam note.

### 3. Practice Validation
The detected note is compared with the expected note from the lesson. Based on accuracy, the app marks it as correct, sloppy, or missed.

### 4. AI Feedback
After a practice session, performance data is sent to AI Ustaad, which generates personalised feedback in Hindi.

---

## Tech Stack

| Layer | Technology |
|------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Audio | Web Audio API |
| Pitch Detection | Custom YIN implementation |
| AI Feedback | Groq API (Llama 3.1) |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Voice | Web Speech API |
| Hosting | GitHub Pages |
| PWA | Service Worker + Manifest |

---

## Architecture Overview

- User plays harmonica into microphone  
- Web Audio API captures audio signal  
- YIN algorithm detects pitch in real time  
- Practice engine compares detected note with expected note  
- Session performance is processed locally  
- AI feedback is triggered after session completion  
- Firestore manages users, subscriptions, and unlock codes  

---

## Project Structure

```bash
harmonicaguru/
│
├── index.html
├── manifest.json
├── sw.js
│
├── css/
│   ├── main.css
│   └── lesson.css
│
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── audio.js
│   ├── yin.js
│   ├── practice.js
│   ├── lesson.js
│   ├── songs.js
│   ├── request.js
│   ├── timer.js
│   ├── voice.js
│   └── firebase-config.js
│
├── assets/
│   ├── data/
│   │   └── lessons.js
│   └── screenshots/
│
└── README.md
````

### Key Files

* `index.html` — main application shell
* `js/app.js` — navigation, unlock logic, admin controls
* `js/audio.js` — microphone + pitch detection pipeline
* `js/yin.js` — YIN pitch detection algorithm
* `js/practice.js` — sargam practice engine
* `js/lesson.js` — lesson + AI feedback flow

---

## Freemium Model

### Free

* C scale practice
* 20 minutes per day
* 5 AI feedback credits
* Happy Birthday starter lesson

### Paid

* ₹99/month subscription
* Unlimited practice
* All scales and exercises
* AI credit packs
* Song unlocks

---

## Key Design Decisions

### Why Vanilla JavaScript?

Kept the app lightweight and fast without introducing framework complexity for an MVP.

### Why Progressive Web App?

Target users are mobile-first. PWA allows instant access without Play Store dependency.

### Why Sargam-first approach?

Indian learners relate more to Sa Re Ga Ma than Western notation.

### Why manual payments?

Used to validate demand before investing in payment gateway integration.

---

## Local Setup

1. Clone the repository
2. Open in VS Code
3. Run using Live Server

```bash
git clone https://github.com/YOUR_USERNAME/harmonicaguru.git
```

---

## Current Limitations

* Bend note detection not implemented yet
* Manual payment flow (MVP stage)
* Performance depends on noise levels
* AI feedback requires internet

---

## Roadmap

* More song lessons
* Ear training mode
* Razorpay payment integration
* Secure backend for AI API
* Analytics dashboard
* Custom domain deployment

---

## Author

**Shubham Kumar**
Musician and creator of HarmonicaGuru

YouTube: [https://youtube.com/@Acoustic_Bihari](https://youtube.com/@Acoustic_Bihari)
GitHub: [https://github.com/YOUR_USERNAME](https://github.com/kumarvmcshubham)

Built as a weekend project to make harmonica learning more accessible for Indian learners.




