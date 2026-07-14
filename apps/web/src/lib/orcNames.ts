const ORC_NAMES = [
  "Grok Snotfang",
  "Uzguk the Unwashed",
  "Broghar Toe-Muncher",
  "Snaggle Bumhelm",
  "Gorbag Left-Boot",
  "Muzka Tripsalot",
  "Grishnak Cheesebeard",
  "Vrakk the Ticklish",
  "Ogrun Sockthief",
  "Bloodtusk McNugget",
  "Zog the Mildly Cross",
  "Nazrug Wartnose",
  "Krud Spoonbender",
  "Hoggle Stinkfoot",
  "Ragash the Confused",
  "Durzol Bellyrumble",
  "Skarn Pebblegut",
  "Mogka the Loud",
  "Thrukk Two-Thumbs",
  "Bogrot Damp-Sock",
];

/** Returns a random funny orc name for pre-filling the join form. */
export function randomOrcName(): string {
  return ORC_NAMES[Math.floor(Math.random() * ORC_NAMES.length)];
}
