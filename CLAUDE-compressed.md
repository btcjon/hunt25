# Hunt25 - Bennett Family Christmas Treasure Hunt

Next.js 15 App Router | TypeScript | Tailwind v4 | Zustand | Claude API | ElevenLabs TTS | Netlify

## Commands
```bash
npm run dev          # Dev server :3000
npm run build        # Production build
npx netlify-cli deploy --prod --dir=.next
```

## Structure
```
src/app/
  page.tsx              # Home - team name
  api/chat/route.ts     # Granddaddy chat
  api/verify/route.ts   # Location verify
  quest/intro/          # Opening narration
  quest/[stop]/         # Clue screens 1-8
  quest/celebration/    # Success screens
  quest/finale/         # Final reveal

src/lib/
  ai/granddaddy.ts      # AI personality/prompts
  game/clues.ts         # 8 clue definitions
  game/state.ts         # Zustand state
  voice/elevenlabs.ts   # TTS

src/components/game/
  Starfield.tsx         # Animated background
  KaraokeText.tsx       # Word highlighting
  ReplayAudio.tsx       # Audio button
```

## Env Vars
```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_...
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=JoYo65swyP8hH6fVMeTO
```

## Flow
Home → Intro → Clue[1-8] → Celebration → Finale

## Patterns
- Voice-first (ElevenLabs TTS)
- Timer-gated hints (15min), parent override: 4343
- Karaoke sync ~130 WPM
- Zustand localStorage persist

## Participants
Mackenzie(20F), Braxton(15M), Juniper(15M), Michael(13M), Ben(10M), Ivy(7F)

## Common Edits
- Clues: `lib/game/clues.ts`
- AI: `lib/ai/granddaddy.ts`
- Timing: `HINT_UNLOCK_MINUTES` in `[stop]/page.tsx`
- Avatar: `/public/granddaddy.png`
