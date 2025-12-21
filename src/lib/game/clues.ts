// All 8 clues for the Star Seekers' Quest

export interface Clue {
  id: number;
  symbol: string;
  name: string;
  fromLocation: string;
  toLocation: string;
  gps?: string; // GPS coordinates for verification
  verse: string;
  scripture: string;
  scriptureText: string;
  hint: string;
  visualIdentifiers: string[];
  followUpQuestions: string[];
}

export const CLUES: Clue[] = [
  {
    id: 1,
    symbol: "⭐",
    name: "THE STAR",
    fromLocation: "Home Base",
    toLocation: "Giant Light Tree + Yellow Statue (Camptown Center)",
    gps: "33°37'28\"N 78°57'26\"W",
    verse: `"Wise Men looked up and they knew where to go—
A STAR in the sky put on quite a show!
Find the tallest bright tower of lights in this place,
With a five-pointed friend wearing shades on her face.
Looking toward your next destination.
Onward you go now - no procrastination!"`,
    scripture: "Matthew 2:2",
    scriptureText: "We saw His star when it rose and have come to worship Him.",
    hint: "Where do families gather for events? Look for something reaching toward the sky... and someone sunny resting nearby.",
    visualIdentifiers: [
      "7-ft yellow starfish statue wearing sunglasses",
      "Red Christmas bow on statue",
      "Giant metal Christmas light tree",
      "Red bow on top of light tree",
      "Rope fence with wooden posts",
      "Ocean Lakes and Sand Dunes signage"
    ],
    followUpQuestions: [
      "What's Sandy wearing on her head?",
      "What color is the big starfish?",
      "Is there a bow on the light tree?"
    ]
  },
  {
    id: 2,
    symbol: "🚶",
    name: "THE JOURNEY",
    fromLocation: "Light Tree + Sandy Statue (Camptown)",
    toLocation: "Observation Deck (Beachfront)",
    gps: "33°37'19\"N 78°57'22\"W",
    verse: `"The star's shining bright—now your JOURNEY begins!
The Wise Men set off through the thick and the thins.
Find the lookout that watches where water meets land,
Near a shop selling coffee and cold treats so grand.
They traveled by night with their eyes on the sky—
Climb up to the deck and see waves rolling by!"`,
    scripture: "Matthew 2:1",
    scriptureText: "Magi from the east came to Jerusalem.",
    hint: "Where can you get a treat AND see forever? Think high places where waves meet sand.",
    visualIdentifiers: [
      "Sandy's Coffee & Creamery oval sign",
      "Starfish holding coffee cup",
      "Sandy's Downunder surfboard-shaped sign",
      "Observation tower with starfish flag",
      "Wooden deck with railings",
      "Blue Adirondack chairs",
      "Palm trees"
    ],
    followUpQuestions: [
      "Can you hear the waves?",
      "Is there a coffee shop nearby?",
      "Can you see the ocean from there?"
    ]
  },
  {
    id: 3,
    symbol: "👫",
    name: "MARY & JOSEPH",
    fromLocation: "Observation Deck (Beachfront)",
    toLocation: "Twin Painted Chairs (Nature Area by Magnolia Lake)",
    gps: "33°37'25\"N 78°57'32\"W",
    verse: `"The journey continues—now into the trees!
Where dogs run and play and discoveries tease.
By the lake where the turtles and nature folk dwell,
TWO SEATS sit together with stories to tell.
Watching over the water and painted up bright—
Like Mary and Joseph on that first holy night!"`,
    scripture: "Matthew 1:24",
    scriptureText: "Joseph did what the angel of the Lord commanded him.",
    hint: "Nature has a special spot where four-legged friends roam free. What sits together watching the water?",
    visualIdentifiers: [
      "Two large painted Adirondack chairs",
      "Blue and pink chairs with Sandy starfish designs",
      "Magnolia Lake in background",
      "Please Put Waste in its Place sign with Sandy",
      "Nature Center Discovery Lab entrance sign",
      "Shady trees by lakeside"
    ],
    followUpQuestions: [
      "Are the chairs blue and pink or both the same?",
      "Can you see the lake?",
      "Is there a dog park nearby?"
    ]
  },
  {
    id: 4,
    symbol: "🎁",
    name: "THE GIFTS",
    fromLocation: "Twin Chairs (Nature Area / Magnolia Lake)",
    toLocation: "Indoor Christmas Tree (Inside Sandy Harbor Family Fun Center)",
    gps: "33°37'22\"N 78°57'26\"W",
    verse: `"You found the sweet couple—now treasures await!
The Wise Men brought GIFTS—and they couldn't be late.
Seek where laughter echoes and joy fills the air,
Step THROUGH the threshold—what you seek waits in there.
Near evergreen branches with boxes wrapped tight—
The Magi presented their gifts on that night!"`,
    scripture: "Matthew 2:11",
    scriptureText: "They presented Him with gifts of gold, frankincense, and myrrh.",
    hint: "Think about where families gather when it's too cold outside. Cross the threshold... treasures wait near where evergreen meets celebration.",
    visualIdentifiers: [
      "Sandy Harbor Family Fun Center oval entrance sign",
      "Christmas tree with white star on top",
      "Wrapped presents underneath tree",
      "Light-up Santa figure on ladder",
      "Light-up Reindeer with Santa hat",
      "Happy Holidays window decorations"
    ],
    followUpQuestions: [
      "How many presents are under the tree?",
      "Is there a Santa decoration?",
      "What's on top of the tree?"
    ]
  },
  {
    id: 5,
    symbol: "🏘️",
    name: "BETHLEHEM",
    fromLocation: "Indoor Christmas Tree (Sandy Harbor Inside)",
    toLocation: "Mini Golf Village (Sandy Harbor Outside)",
    gps: "33°37'23\"N 78°57'26\"W",
    verse: `"The gifts are all gathered—now where do they go?
To a LITTLE TOWN humble, where carols all flow.
Step back OUTSIDE to a village so small,
With tiny bright buildings that stand proud and tall.
Red, green, and yellow—where small balls roll through—
'O Little Town' waited for me and for you!"`,
    scripture: "Micah 5:2",
    scriptureText: "But you, Bethlehem… out of you will come a ruler over Israel.",
    hint: "Stay close! Sometimes the next treasure is just steps away. What's colorful and fun right outside?",
    visualIdentifiers: [
      "Sandy Harbor Mini Golf oval sign",
      "Fisherman's Wharf themed buildings",
      "Yellow tower with Sandy Harbor logo",
      "Harbor Marine Supplies sign on green building",
      "Red, green, yellow painted structures",
      "White picket fence",
      "Palm trees and lighthouse"
    ],
    followUpQuestions: [
      "What color is the tallest building?",
      "Is there a lighthouse?",
      "Can you see the mini golf holes?"
    ]
  },
  {
    id: 6,
    symbol: "👼",
    name: "THE ANGEL",
    fromLocation: "Mini Golf Village (Sandy Harbor)",
    toLocation: "Angel Tree Topper (Inside Sandy Mart)",
    gps: "33°37'29\"N 78°57'29\"W",
    verse: `"Bethlehem's found—now hear the good word!
A MESSENGER came with the best news e'er heard.
Head to the store where the campers all shop,
Step inside and look UP at the tree's tippy-top!
Who's got wings spread wide, dressed in robes flowing white?
She sang 'Do not fear!' on that glorious night!"`,
    scripture: "Luke 2:10",
    scriptureText: "The angel said, 'Do not be afraid. I bring you good news that will cause great joy!'",
    hint: "Campers need supplies, right? Look UP when you get there... messengers often appear at the highest point.",
    visualIdentifiers: [
      "Sandy Mart exterior sign (red/white)",
      "Starfish hanging off sign",
      "Christmas tree with angel tree topper",
      "Angel in red/white robe",
      "Fake fireplace display with stockings",
      "Gifts under tree"
    ],
    followUpQuestions: [
      "Is the angel's robe white or red?",
      "Does the angel have wings?",
      "Is there a fireplace display?"
    ]
  },
  {
    id: 7,
    symbol: "🏨",
    name: "THE INN",
    fromLocation: "Sandy Mart (Inside, at the Angel Tree)",
    toLocation: "Fireplace Pavilion (Near Front Entrance)",
    gps: "33°37'41\"N 78°57'41\"W",
    verse: `"The angel announced it—now where will they stay?
Most inns were too full and just turned them away.
Go back to the place where you first said 'We're here!'
Near the gates that you entered to start this whole year.
A SHELTER with fire and stockings hung tight—
This inn has a room and it's glowing with light!"`,
    scripture: "Luke 2:7",
    scriptureText: "There was no guest room available for them.",
    hint: "Remember where your adventure at camp began? Return to the beginning... warmth and welcome await weary travelers.",
    visualIdentifiers: [
      "Covered pavilion with stone fireplace",
      "Red Christmas stockings on mantle",
      "Large wreath with red bow",
      "Two Adirondack chairs facing fireplace",
      "Circular brick paver patio with compass/star design",
      "Fountain nearby",
      "Hanging flower baskets"
    ],
    followUpQuestions: [
      "Are there stockings on the fireplace?",
      "Is there a wreath?",
      "Can you see the fountain?"
    ]
  },
  {
    id: 8,
    symbol: "⏰",
    name: "FULLNESS OF TIME",
    fromLocation: "Fireplace Pavilion (Near Front Entrance)",
    toLocation: "Clock Tower (Near Camptown / Sandy Mart)",
    gps: "33°37'30\"N 78°57'28\"W",
    verse: `"The shelter is found—nearly done with your quest!
One treasure remains, and it might be the best.
Find what has HANDS but can't give you a wave,
A face with no mouth, yet it's perfectly brave.
WAIT—this one's got eyes! And it's rocking a bow!
When TIME was just right, God said 'Now is the show!'"`,
    scripture: "Galatians 4:4",
    scriptureText: "But when the set time had fully come, God sent His Son.",
    hint: "Head back toward where it all started. Something tall tells the time... and it has a friendly face you might recognize!",
    visualIdentifiers: [
      "Tall clock tower structure",
      "Clock face with Sandy starfish wearing sunglasses",
      "Numbers 12, 3, 6, 9 visible",
      "Large red Christmas bow on tower",
      "Rope fence around base",
      "Ornamental grasses and flower beds"
    ],
    followUpQuestions: [
      "What's in the center of the clock face?",
      "Is there a bow on the tower?",
      "Does Sandy have sunglasses?"
    ]
  }
];

export const FINALE = {
  symbol: "👶",
  name: "BABY JESUS",
  fromLocation: "Clock Tower (Camptown)",
  toLocation: "HOME BASE — The Greatest Treasure!",
  verse: `"You followed the STAR when it first caught your eye,
You made the great JOURNEY beneath the wide sky,
Found MARY and JOSEPH both patient and true,
The GIFTS and the LITTLE TOWN waiting for you,
The ANGEL who sang and the INN with a light,
The CLOCK ticking perfect through that holy night—

But what was it all for? Why travel so far?
Why follow the trail of that very first star?

RACE BACK TO HOME BASE—your quest's almost done!
The answer is waiting: GOD'S ONLY SON!"`,
  scripture: "Luke 2:11",
  scriptureText: "Unto you is born this day in the city of David a Savior, who is Christ the Lord."
};

export const BACKUP_KEYWORDS: Record<number, string> = {
  1: "STAR",
  2: "JOURNEY",
  3: "MARY",
  4: "GIFTS",
  5: "BETHLEHEM",
  6: "ANGEL",
  7: "INN",
  8: "TIME"
};
