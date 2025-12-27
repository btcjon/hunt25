// Generate all cached audio files for Hunt25 using ElevenLabs
// Run with: npx tsx scripts/generate-audio.ts

import * as fs from 'fs';
import * as path from 'path';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const VOICE_ID = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'JoYo65swyP8hH6fVMeTO';
const API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('Missing NEXT_PUBLIC_ELEVENLABS_API_KEY environment variable');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '../public/audio');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============ AUDIO CONTENT ============

const INTRO_DIALOG = `Well hello there, Bennett family treasure hunters! It's your Granddaddy!

Tonight's the night for a RACE so grand,
Two teams of seekers across this land!
Team ONE: Mackenzie, Ivy, and Michael too—
Team TWO: Braxton, Ben, and Juniper crew!

Long ago, Wise Men followed a STAR so bright,
Through desert and darkness, day and night.
Now YOU will race through clues galore,
Eight treasures to find — who'll find them before?

Here's how it works, so listen up tight:
Read each clue, then search left and right!
When you think you've found the right spot,
Use GPS or snap a photo — give it a shot!

Your TIMER starts now and won't stop ticking,
So move those feet — no lollygagging or picking!
The clock is watching every move you make,
First team home wins — for Christmas's sake!

If you're confused or need a little light,
Just tap "Ask Granddaddy" — I'll help you get it right!
But here's the secret, the key to success:
Work as a TEAM — no solo, no less!

Listen to each other, share what you see,
Work together closely — that's the key!
The youngest might spot what the oldest missed,
So keep your eyes open — nothing dismissed!

Now when you're ready, tap to begin,
The star is rising — may the best team win!
Race through the clues, then hurry back home,
First one to check in claims the Christmas throne!`;

const CLUES = [
  {
    id: 1,
    name: "THE STAR",
    verse: `"Wise Men looked up and they knew where to go—
A STAR in the sky put on quite a show!
Find the tallest bright tower of lights in this place,
With a five-pointed friend wearing shades on her face.
Looking toward your next destination.
Onward you go now - no procrastination!"`,
    scripture: "Matthew 2:2",
    scriptureText: "We saw His star when it rose and have come to worship Him.",
  },
  {
    id: 2,
    name: "THE JOURNEY",
    verse: `"The star's shining bright—now your JOURNEY begins!
The Wise Men set off through the thick and the thins.
Find the lookout that watches where water meets land,
Near a shop selling coffee and cold treats so grand.
They traveled by night with their eyes on the sky—
Ascend to the summit and see waves rolling by!"`,
    scripture: "Matthew 2:1",
    scriptureText: "Magi from the east came to Jerusalem.",
  },
  {
    id: 3,
    name: "MARY & JOSEPH",
    verse: `"The journey continues—now into the trees!
Where dogs run and play and discoveries tease.
By the lake where the turtles and nature folk dwell,
TWO SEATS sit together with stories to tell.
Watching over the water and painted up bright—
Like Mary and Joseph on that first holy night!"`,
    scripture: "Matthew 1:24",
    scriptureText: "Joseph did what the angel of the Lord commanded him.",
  },
  {
    id: 4,
    name: "THE GIFTS",
    verse: `"Congratulations, you are on the right path—now treasures await!
The Wise Men brought GIFTS—and they couldn't be late.
Head to where families all play,
Step INSIDE and find what you seek right away.
A tree decked in lights with wrapped boxes below—
Gold, frankincense, myrrh... what a generous show!"`,
    scripture: "Matthew 2:11",
    scriptureText: "They presented Him with gifts of gold, frankincense, and myrrh.",
  },
  {
    id: 5,
    name: "BETHLEHEM",
    verse: `"The gifts are all gathered—now where do they go?
To a LITTLE TOWN humble, where carols all flow.
Nearby is a village so small,
With tiny bright buildings that stand proud and tall.
Red, green, and yellow—where small orbs roll through—
'O Little Town' waited for me and for you!"`,
    scripture: "Micah 5:2",
    scriptureText: "But you, Bethlehem… out of you will come a ruler over Israel.",
  },
  {
    id: 6,
    name: "THE ANGEL",
    verse: `"Bethlehem's found—now hear the good word!
A MESSENGER came with the best news e'er heard.
A mercantile along the way is your next stop,
Inside look around from floor to tippy-top!
Wings spread wide, in robes flowing white?
She sang 'Do not fear!' on that glorious night!"`,
    scripture: "Luke 2:10",
    scriptureText: "The angel said, 'Do not be afraid. I bring you good news that will cause great joy!'",
  },
  {
    id: 7,
    name: "THE INN",
    verse: `"The angel announced it—now where will they stay?
Most inns were too full and just turned them away.
Go back to the place where you first said 'We're here!'
Near the gates that you entered to start this whole year.
A SHELTER with fire and stockings hung tight—
This inn has a room and it's glowing with light!"`,
    scripture: "Luke 2:7",
    scriptureText: "There was no guest room available for them.",
  },
  {
    id: 8,
    name: "FULLNESS OF TIME",
    verse: `"The shelter is found—nearly done with your quest!
One treasure remains, and it might be the best.
Find what has HANDS but can't give you a wave,
A face with no mouth, yet it's perfectly brave.
WAIT—this one's got eyes! And it's rocking a bow!
God's timing was perfect... He always knows!"`,
    scripture: "Galatians 4:4",
    scriptureText: "But when the set time had fully come, God sent His Son.",
  },
];

const CELEBRATION_MESSAGES = [
  "YES! You found THE STAR! Just like the Wise Men, when we look for God's signs, He shows us the way!",
  "AMAZING! THE JOURNEY has begun! The Wise Men traveled far because their faith moved them to ACTION. Keep moving, seekers!",
  "WOW! You found their RESTING SPOT! Mary and Joseph needed a place to rest on their long journey - just like these two chairs watching over the lake together. Faith means trusting God even when the road is long!",
  "FANTASTIC! THE GIFTS! We give gifts at Christmas because God gave us the GREATEST gift - His Son!",
  "INCREDIBLE! BETHLEHEM! God chose a tiny, humble town. He doesn't need big places to do BIG things!",
  "HOORAY! THE ANGEL! 'Do not be afraid!' The angels brought GOOD NEWS of great joy for ALL people!",
  "WONDERFUL! THE INN! The world had no room, but God ALWAYS makes a way for those who seek Him!",
  "PERFECT! FULLNESS OF TIME! At just the right moment, God sent Jesus. His timing is ALWAYS perfect!",
];

const FINALE_VERSE = `"You followed the STAR when it first caught your eye,
You made the great JOURNEY beneath the wide sky,
Followed MARY and JOSEPH, patient and true,
GIFTS and the LITTLE TOWN waiting for you,
The ANGEL who sang and the INN with a light,
The CLOCK, God's perfect timing that holy night—

But what was it all for? Why travel so far?
Why follow the trail of that very first star?

BACK TO HOME BASE—your quest almost done!
The answer is waiting: GOD'S ONLY SON!"`;

const FINALE_SCRIPTURE = "Luke 2:11";
const FINALE_SCRIPTURE_TEXT = "Unto you is born this day in the city of David a Savior, who is Christ the Lord.";

// ============ TTS FUNCTION ============

async function generateAudio(text: string, filename: string): Promise<void> {
  const outputPath = path.join(OUTPUT_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log(`  [SKIP] ${filename} already exists`);
    return;
  }

  console.log(`  [GEN] ${filename} (${text.length} chars)...`);

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${VOICE_ID}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY!,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.85,
        style: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs error for ${filename}: ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(outputPath, buffer);
  console.log(`  [OK] ${filename} (${buffer.length} bytes)`);

  // Rate limiting - ElevenLabs has limits
  await new Promise(resolve => setTimeout(resolve, 500));
}

// ============ MAIN ============

async function main() {
  console.log('\n=== Hunt25 Audio Generator ===\n');
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Voice ID: ${VOICE_ID}\n`);

  // 1. Intro
  console.log('1. Generating intro audio...');
  await generateAudio(INTRO_DIALOG, 'intro.mp3');

  // 2. Clues (verse + scripture)
  console.log('\n2. Generating clue audio files...');
  for (const clue of CLUES) {
    const clueText = `${clue.verse} ... ${clue.scripture} says: "${clue.scriptureText}"`;
    await generateAudio(clueText, `clue-${clue.id}.mp3`);
  }

  // 3. Celebrations
  console.log('\n3. Generating celebration audio files...');
  for (let i = 0; i < CLUES.length; i++) {
    const clue = CLUES[i];
    const message = CELEBRATION_MESSAGES[i];
    const celebrationText = `${message} You found ${clue.name}! ${clue.scripture} says: "${clue.scriptureText}"`;
    await generateAudio(celebrationText, `celebration-${clue.id}.mp3`);
  }

  // 4. Finale
  console.log('\n4. Generating finale audio...');
  const finaleText = `${FINALE_VERSE} ... ${FINALE_SCRIPTURE} says: "${FINALE_SCRIPTURE_TEXT}"`;
  await generateAudio(finaleText, 'finale.mp3');

  console.log('\n=== Complete! ===\n');

  // List generated files
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.mp3'));
  console.log(`Generated ${files.length} audio files:`);
  files.forEach(f => {
    const stats = fs.statSync(path.join(OUTPUT_DIR, f));
    console.log(`  - ${f} (${(stats.size / 1024).toFixed(1)} KB)`);
  });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
