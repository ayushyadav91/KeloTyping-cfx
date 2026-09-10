export interface TextPrompt {
  id: string;
  content: string;
  characterCount: number;
  author?: string;
  category?: string;
}

export class PromptsService {
  private static readonly PROMPTS: Omit<TextPrompt, 'characterCount'>[] = [
    {
      id: 'prompt_001',
      content: 'Simplicity is prerequisite for reliability. Software engineering is the art of building systems that stay simple under complexity.',
      author: 'Edsger W. Dijkstra',
      category: 'Software Engineering',
    },
    {
      id: 'prompt_002',
      content: 'Premature optimization is the root of all evil in programming. Write clean, readable code first, then measure before optimizing.',
      author: 'Donald Knuth',
      category: 'Computer Science',
    },
    {
      id: 'prompt_003',
      content: 'Talk is cheap. Show me the code. Clean typescript and robust websocket handlers turn ideas into high performance systems.',
      author: 'Linus Torvalds',
      category: 'Programming',
    },
    {
      id: 'prompt_004',
      content: 'The best error message is the one that never shows up. Build self-healing systems with comprehensive validation at every boundary.',
      author: 'Anonymous',
      category: 'Architecture',
    },
    {
      id: 'prompt_005',
      content: 'First, solve the problem. Then, write the code. Understand your domain, design your state transitions, and execution becomes seamless.',
      author: 'John Johnson',
      category: 'Problem Solving',
    },
    {
      id: 'prompt_006',
      content: 'In real-time systems, latency is the ultimate metric. Microseconds matter when thousands of keystrokes stream concurrently.',
      author: 'Backend Engineering Team',
      category: 'WebSockets',
    },
  ];

  public getRandomPrompt(): TextPrompt {
    const index = Math.floor(Math.random() * PromptsService.PROMPTS.length);
    const selected = PromptsService.PROMPTS[index];
    if (!selected) {
      throw new Error('No prompts found');
    }

    const result: TextPrompt = {
      id: selected.id,
      content: selected.content,
      characterCount: selected.content.length,
    };
    if (selected.author !== undefined) result.author = selected.author;
    if (selected.category !== undefined) result.category = selected.category;
    return result;
  }

  public getPromptById(id: string): TextPrompt | undefined {
    const found = PromptsService.PROMPTS.find((p) => p.id === id);
    if (!found) return undefined;

    const result: TextPrompt = {
      id: found.id,
      content: found.content,
      characterCount: found.content.length,
    };
    if (found.author !== undefined) result.author = found.author;
    if (found.category !== undefined) result.category = found.category;
    return result;
  }
}

export const promptsService = new PromptsService();

