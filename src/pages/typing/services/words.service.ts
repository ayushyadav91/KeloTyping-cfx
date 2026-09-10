const COMMON_WORDS = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
  'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
  'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
  'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'us', 'great', 'between', 'need',
  'large', 'often', 'hand', 'high', 'place', 'hold', 'turn', 'full', 'open',
  'seem', 'together', 'next', 'white', 'children', 'begin', 'got', 'walk',
  'example', 'ease', 'paper', 'group', 'always', 'music', 'those', 'both',
  'mark', 'book', 'letter', 'until', 'mile', 'river', 'car', 'feet', 'care',
  'second', 'enough', 'plain', 'girl', 'usual', 'young', 'ready', 'above',
  'ever', 'red', 'list', 'though', 'feel', 'talk', 'bird', 'soon', 'body',
  'dog', 'family', 'direct', 'pose', 'leave', 'song', 'measure', 'door',
  'product', 'black', 'short', 'numeral', 'class', 'wind', 'question', 'happen',
];

const QUOTES = [
  'He had spent three years learning to play the piano by ear, note by note, song by song. Some evenings the music came easily, flowing from his fingers. Other nights it felt like pushing water uphill, slow and stubborn and exhausting.',
  'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vile and quixotic the jumpy zebra frog. Sphinx of black quartz judge my vow.',
  'Success is not final, failure is not fatal: it is the courage to continue that counts. The secret of getting ahead is getting started. All our dreams can come true if we have the courage to pursue them.',
  'In the beginning was the word, and the word was with the programmer, and the word was code. Clean code reads like well-written prose. The best code is no code at all.',
  'Practice does not make perfect. Only perfect practice makes perfect. Consistency is the key to mastery. Every expert was once a beginner who refused to give up.',
];

export function generateWords(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)]);
  }
  return result;
}

export function generateQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
