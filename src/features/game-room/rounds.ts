import { questionsFor } from '@/features/crowdplay/schedule'
import type { Round } from './types'

// Every CrowdPlay question of a session, in order. The questions and their times live in
// features/crowdplay/schedule.ts; the recap and the fan's country read them through here.
export const roundsFor = (sessionId: string): Round[] => questionsFor(sessionId)
