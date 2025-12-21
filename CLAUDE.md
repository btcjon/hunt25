# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hunt25** - Bennett Family Christmas Treasure Hunt App

An interactive treasure hunt game where "Granddaddy" guides grandchildren through 8 stops to discover the Christmas story. Features AI-powered conversations, ElevenLabs TTS voice synthesis, and karaoke-style text highlighting.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand with persist middleware
- **AI**: Claude API (Anthropic SDK)
- **Voice**: ElevenLabs TTS
- **Deployment**: Netlify

## Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Build
npm run build        # Production build

# Lint
npm run lint         # Run ESLint

# Deploy
npx netlify-cli deploy --prod --dir=.next
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home - team name entry
│   ├── api/
│   │   ├── chat/route.ts  # Granddaddy chat endpoint
│   │   └── verify/route.ts # Location verification
│   └── quest/
│       ├── intro/page.tsx        # Opening narration
│       ├── [stop]/page.tsx       # Clue screen (stops 1-8)
│       ├── celebration/[stop]/   # Success celebration
│       └── finale/page.tsx       # Final reveal
├── components/game/
│   ├── Starfield.tsx      # Animated star background
│   ├── KaraokeText.tsx    # Word-by-word highlighting
│   └── ReplayAudio.tsx    # Audio control button
└── lib/
    ├── ai/
    │   ├── claude.ts      # Claude API client
    │   └── granddaddy.ts  # AI personality & prompts
    ├── game/
    │   ├── clues.ts       # 8 clue definitions
    │   └── state.ts       # Zustand game state
    └── voice/
        ├── elevenlabs.ts  # ElevenLabs TTS
        └── webSpeech.ts   # Browser speech (unused)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/game/clues.ts` | All 8 clue verses, hints, scripture references |
| `src/lib/ai/granddaddy.ts` | AI system prompt, personality, INTRO_DIALOG |
| `src/lib/game/state.ts` | Game progress, collected symbols, chat history |
| `src/app/quest/[stop]/page.tsx` | Main gameplay screen with chat, hints, timers |

## Environment Variables

Required in `.env.local` and Netlify:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_...
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=JoYo65swyP8hH6fVMeTO
```

## Game Flow

1. **Home** → Enter team name
2. **Intro** → Granddaddy welcomes family, explains quest
3. **Clue [1-8]** → Read verse, ask questions, find location, verify
4. **Celebration** → Collect symbol, hear Christmas message
5. **Finale** → All 8 symbols revealed, Baby Jesus

## Design Patterns

- **Voice-first**: All text is spoken via ElevenLabs TTS
- **Timer-gated hints**: Hints unlock after 15 minutes per stop
- **Parent override**: Password `4343` bypasses timers
- **Karaoke sync**: Text highlights at ~130 WPM to match audio
- **Persistence**: Zustand persists to localStorage

## Participants

Granddaddy's grandchildren (reference by name in AI responses):
- Mackenzie (20, F) - oldest, leader
- Braxton (15, M) - teen
- Juniper (15, M) - teen
- Michael (13, M) - young teen
- Ben (10, M) - younger
- Ivy (7, F) - youngest

## Common Tasks

### Update a clue
Edit `src/lib/game/clues.ts` - modify `verse`, `hint`, or `scriptureText`

### Change AI personality
Edit `src/lib/ai/granddaddy.ts` - modify system prompt or INTRO_DIALOG

### Adjust timing
- Hint unlock: `HINT_UNLOCK_MINUTES` in `[stop]/page.tsx`
- Karaoke speed: `wordsPerMinute` prop on KaraokeText

### Update avatar
Replace `/public/granddaddy.png`
