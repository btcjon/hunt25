# Star Seekers' Quest — Web App Concept

## One-Liner

AI Game Master guides kids through an 8-stop Christmas treasure hunt using voice, chat, and photo verification.

-----

## How It Works

```
KID SNAPS PHOTO → GEMINI VERIFIES LOCATION → CELEBRATION → NEXT CLUE
```

Kids interact with **Captain Sandy**, a witty AI character who:

- Delivers rhyming clues via text + voice (TTS)
- Verifies locations when kids upload photos
- Chats naturally, gives hints, stays on track
- Celebrates each discovery with animation + scripture

-----

## The 8 Stops

|#|Symbol            |Location             |What They Find            |
|-|------------------|---------------------|--------------------------|
|1|⭐ THE STAR        |Camptown             |Light tree + Sandy statue |
|2|🚶 THE JOURNEY     |Beachfront           |Observation deck          |
|3|👫 MARY & JOSEPH   |Magnolia Lake        |Twin painted chairs       |
|4|🎁 THE GIFTS       |Sandy Harbor (inside)|Christmas tree + presents |
|5|🏘️ BETHLEHEM       |Mini Golf            |Colorful village buildings|
|6|👼 THE ANGEL       |Sandy Mart (inside)  |Angel tree topper         |
|7|🏨 THE INN         |Front Entrance       |Fireplace pavilion        |
|8|⏰ FULLNESS OF TIME|Camptown             |Sandy clock tower         |
|🏠|👶 BABY JESUS      |Home Base            |Final celebration         |

-----

## User Flow

```
START
  │
  ▼
┌─────────────────────────────┐
│  "Enter your team name"     │
│  [BEGIN QUEST]              │
└─────────────────────────────┘
  │
  ▼
┌─────────────────────────────┐
│  CAPTAIN SANDY INTRO        │
│  Voice + text backstory     │
│  "Long ago, Wise Men..."    │
└─────────────────────────────┘
  │
  ▼
┌─────────────────────────────┐
│  CLUE SCREEN                │
│  • Progress bar (●●○○○○○○)  │
│  • Rhyming clue + hint      │
│  • [🎤 Talk] [📷 Found It!] │
└─────────────────────────────┘
  │
  ├──► CHAT: Kids ask questions, get hints
  │
  ├──► PHOTO: Upload → AI checks → ✅ or ❌
  │
  ▼
┌─────────────────────────────┐
│  🎉 CELEBRATION             │
│  Confetti + symbol collected│
│  Scripture verse            │
│  [NEXT CLUE →]              │
└─────────────────────────────┘
  │
  ▼
  (repeat 8 times)
  │
  ▼
┌─────────────────────────────┐
│  FINALE: RACE HOME!         │
│  All symbols assemble       │
│  Baby Jesus revealed        │
│  Luke 2:11                  │
└─────────────────────────────┘
```

-----

## Captain Sandy — AI Personality

**Voice:** Warm, playful, dramatic narrator. Beach vibes + Christmas spirit.

**Does:**

- Delivers clues with enthusiasm
- Gives progressive hints when stuck
- Celebrates HARD at each success
- Keeps kids on track with humor
- Weaves scripture naturally

**Doesn't:**

- Reveal next location early
- Skip stops
- Get preachy
- Break character

**Sample Lines:**

> "Hmm, lovely spot—but my starfish senses say keep looking!"

> "BOOM! You found it! The Magi would be proud!"

> "Ha! Great question. But first—those twin chairs are waiting!"

-----

## Photo Verification

Each stop has 4-6 visual markers. Gemini checks if 2+ match.

**Example — Stop 3 (Twin Chairs):**

- Two oversized Adirondack chairs
- Starfish painted on chairs
- Lake in background
- "Waste in its Place" sign nearby

**If match:** Celebrate → advance
**If partial:** Ask clarifying question
**If wrong:** Encourage → hint → try again

**Backup:** Adult can say keyword (e.g., "MARY") to override

-----

## Key Features

|Feature     |How                                             |
|------------|------------------------------------------------|
|Voice Out   |Web Speech API / Google TTS — Sandy speaks clues|
|Voice In    |Web Speech API — kids talk back                 |
|Photo Verify|Gemini 2.5 Pro vision — analyzes uploaded images|
|Chat        |Text input — natural conversation with Sandy    |
|Celebration |Confetti animation + sound + scripture          |
|Progress    |Visual bar showing 8 stops + collected symbols  |
|Persistence |localStorage — survives refresh/crash           |

-----

## Tech Stack (Gemini AI Studio Build)

|Layer   |Tech                       |
|--------|---------------------------|
|Frontend|React + Tailwind           |
|AI      |Gemini 2.5 Pro (multimodal)|
|Voice   |Web Speech API             |
|State   |localStorage               |
|Hosting |Firebase or Vercel         |

-----

## Screen Mockups

### Clue Screen

```
┌────────────────────────────────┐
│  ●●●○○○○○  Stop 3/8           │
│  Collected: ⭐🚶               │
├────────────────────────────────┤
│                                │
│  🦐 CAPTAIN SANDY:             │
│                                │
│  "The journey continues—       │
│   now into the trees!          │
│   Where dogs run and play      │
│   and discoveries tease..."    │
│                                │
│  📖 Matthew 1:24               │
│                                │
│  💡 Look for two big chairs    │
│     by the lake                │
│                                │
├────────────────────────────────┤
│  [🎤 Talk]  [📷 Found It!]     │
└────────────────────────────────┘
```

### Celebration Screen

```
┌────────────────────────────────┐
│                                │
│        🎉 CONFETTI 🎉          │
│                                │
│            👫                  │
│                                │
│      YOU FOUND IT!             │
│                                │
│   MARY & JOSEPH Collected!     │
│                                │
│  "Two chairs waiting together, │
│   just like Mary and Joseph    │
│   waited for the promised      │
│   child..."                    │
│                                │
│  📖 Matthew 1:24               │
│                                │
│  Your treasures: ⭐🚶👫        │
│                                │
│      [ NEXT CLUE → ]           │
│                                │
└────────────────────────────────┘
```

-----

## Sample Clue Format

```
🗺️ CLUE 3: MARY & JOSEPH

"The journey continues—now into the trees!
Where dogs run and play and discoveries tease.
By the lake where the turtles and nature folk dwell,
TWO SEATS sit together with stories to tell.
Watching over the water and painted up bright—
Like Mary and Joseph on that first holy night!"

📖 Matthew 1:24 — "Joseph did what the angel commanded."

💡 HINT: Head to the nature area near the dog park. Find two colorful chairs by the lake.
```

-----

## MVP Scope

### Must Have

- 8 clues with text display
- Photo upload → Gemini verification
- Chat with Captain Sandy
- Celebration between stops
- Progress tracker

### Nice to Have

- TTS voice output
- Voice input
- Confetti animations
- Sound effects
- Timer

-----

## Why This Works

1. **No prep hiding items** — AI verifies via photo
2. **No QR codes** — more magical, less scavenger hunt
3. **Conversational** — kids can ask questions naturally
4. **Faith-centered** — scripture woven into each win
5. **Flexible** — works if kids go off-script
6. **Memorable** — AI character + voice makes it special

-----

## Gemini Prompt to Build

```
Build a mobile-first React web app for a Christmas treasure hunt.

CORE:
- AI Game Master "Captain Sandy" (witty, encouraging)
- 8 sequential clues as rhyming verses
- Photo verification via Gemini vision
- Celebration animations between clues
- Chat interface for hints/questions
- Progress bar showing 8 stops

TECH: React, Tailwind, Gemini 2.5 Pro API, Web Speech API

The Game Master verifies photos against landmark descriptions,
never skips ahead, and keeps energy high with faith-based
celebrations including scripture at each stop.
```

-----

*"We saw His star when it rose and have come to worship Him." — Matthew 2:2*
