import { calculateTypingStats } from '../utils/wpmCalculator';
import { promptsService } from '../models/prompt.model';
import { SoloSession } from '../models/typing.types';
import { SessionNotFoundError, AntiCheatError } from '../utils/errorResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';

export class TypingService {
  private sessionsMap: Map<string, SoloSession> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startGarbageCollector();
  }

  
    // Initializes a new typing practice session for a user.
   
  public startSession(userId: string, targetPromptId?: string): SoloSession {
    const prompt = targetPromptId
      ? promptsService.getPromptById(targetPromptId) || promptsService.getRandomPrompt()
      : promptsService.getRandomPrompt();

    const now = Date.now();
    const sessionId = `solo_sess_${now}_${Math.random().toString(36).substring(2, 9)}`;

    const initialStats = calculateTypingStats(0, 0, prompt.characterCount, now, now);

    const session: SoloSession = {
      sessionId,
      userId,
      promptId: prompt.id,
      textPrompt: prompt.content,
      characterCount: prompt.characterCount,
      startTime: now,
      lastActiveTime: now,
      lastTickTime: now,
      lastTypedIndex: 0,
      isCompleted: false,
      typedIndex: 0,
      correctCharacters: 0,
      stats: initialStats,
    };

    this.sessionsMap.set(sessionId, session);

    logger.info('Typing session initialized', {
      sessionId,
      userId,
      promptId: prompt.id,
      characterCount: prompt.characterCount,
    });

    return session;
  }

  
  // Evaluates keystroke progress and calculates real-time metrics.
  //  Enforces human velocity thresholds (charDelta > 8 in < 200ms or instant WPM > 250 WPM) to prevent bot manipulation.
   
  public processProgress(
    sessionId: string,
    typedIndex: number,
    correctCharacters: number
  ): SoloSession {
    const session = this.sessionsMap.get(sessionId);

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const now = Date.now();

    if (session.isCompleted) {
      return session;
    }

    if (typedIndex < 0 || typedIndex > session.characterCount) {
      throw new AntiCheatError(`Invalid typedIndex boundaries: ${typedIndex}`);
    }

    const charDelta = typedIndex - session.lastTypedIndex;
    const timeDeltaMs = Math.max(1, now - session.lastTickTime);
    const instantWpm = (charDelta / 5) / (timeDeltaMs / 60000);

    // Anti-cheat rule: charDelta > 8 in < 200ms OR instantWpm > 250 WPM indicates automated keystroke injection
    if ((charDelta > 8 && timeDeltaMs < 200) || (timeDeltaMs >= 100 && instantWpm > 250)) {
      logger.warn('Anti-cheat threshold exceeded', {
        sessionId,
        userId: session.userId,
        charDelta,
        timeDeltaMs,
        instantWpm: Math.round(instantWpm),
      });

      throw new AntiCheatError('Automated typing velocity threshold exceeded.');
    }

    session.lastTypedIndex = typedIndex;
    session.lastTickTime = now;

    const updatedStats = calculateTypingStats(
      typedIndex,
      correctCharacters,
      session.characterCount,
      session.startTime,
      now
    );

    session.typedIndex = typedIndex;
    session.correctCharacters = Math.min(typedIndex, correctCharacters);
    session.stats = updatedStats;
    session.lastActiveTime = now;

    if (updatedStats.isCompleted) {
      session.isCompleted = true;
      session.endTime = now;
      logger.info('Typing session completed', {
        sessionId: session.sessionId,
        userId: session.userId,
        finalWpm: updatedStats.wpm,
        finalWps: updatedStats.wps,
        accuracy: updatedStats.accuracy,
        totalTimeMs: updatedStats.elapsedTimeMs,
      });
    }

    return session;
  }

  public getSession(sessionId: string): SoloSession | undefined {
    return this.sessionsMap.get(sessionId);
  }

  public getActiveSessionsCount(): number {
    return this.sessionsMap.size;
  }

  public endSession(sessionId: string): boolean {
    return this.sessionsMap.delete(sessionId);
  }

//  garbage collection to remove expired/inactive session records.
   
  private startGarbageCollector(): void {
    const intervalMs = env.CLEANUP_INTERVAL_MINUTES * 60 * 1000;
    const ttlMs = env.SESSION_TTL_MINUTES * 60 * 1000;

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      let purgedCount = 0;

      for (const [sessionId, session] of this.sessionsMap.entries()) {
        const inactiveDuration = now - session.lastActiveTime;
        if (inactiveDuration > ttlMs) {
          this.sessionsMap.delete(sessionId);
          purgedCount++;
        }
      }

      if (purgedCount > 0) {
        logger.info('Garbage collection completed', {
          purgedCount,
          remainingSessions: this.sessionsMap.size,
          ttlMinutes: env.SESSION_TTL_MINUTES,
        });
      }
    }, intervalMs);

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  public stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export const typingService = new TypingService();

