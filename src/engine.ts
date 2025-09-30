import type { Difficulty, Question } from './types'
import { nanoid } from 'nanoid'

const DIFFICULTY_TO_SECONDS: Record<Difficulty, number> = {
	easy: 20,
	medium: 60,
	hard: 120,
}

const QUESTION_BANK: Record<Difficulty, string[]> = {
	easy: [
		"What is the difference between var, let, and const in JavaScript?",
		"Explain how React components receive props.",
		"What is the purpose of package.json?",
	],
	medium: [
		"Describe how React hooks like useEffect and useMemo differ and when to use them.",
		"How does Node.js handle concurrency and what is the event loop?",
		"Design a REST endpoint for listing and creating users. What status codes?",
	],
	hard: [
		"How would you implement SSR with React and handle data fetching efficiently?",
		"Explain horizontal scaling a Node.js service behind a load balancer. Challenges?",
		"Describe a strategy to optimize a large React app's bundle size and runtime.",
	],
}

export function generateQuestions(): Question[] {
	const pick = (arr: string[], n: number) => arr.slice(0, n)
	const easy = pick(QUESTION_BANK.easy, 2)
	const medium = pick(QUESTION_BANK.medium, 2)
	const hard = pick(QUESTION_BANK.hard, 2)
	const all: { text: string; difficulty: Difficulty }[] = [
		...easy.map(text => ({ text, difficulty: 'easy' as const })),
		...medium.map(text => ({ text, difficulty: 'medium' as const })),
		...hard.map(text => ({ text, difficulty: 'hard' as const })),
	]
	return all.map(q => ({ id: nanoid(), text: q.text, difficulty: q.difficulty, seconds: DIFFICULTY_TO_SECONDS[q.difficulty] }))
}

export function scoreAnswer(answer: string, difficulty: Difficulty): number {
	const lengthScore = Math.min(answer.trim().length / 200, 1) * 50
	const keywordBoost = (() => {
		const keywords = [
			'react', 'hooks', 'state', 'props', 'node', 'express', 'async', 'await', 'performance', 'scaling', 'api', 'typescript'
		]
		const hits = keywords.reduce((acc, k) => acc + (answer.toLowerCase().includes(k) ? 1 : 0), 0)
		return Math.min(hits * 8, 40)
	})()
	const diffBonus = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 5 : 10
	return Math.round(Math.min(lengthScore + keywordBoost + diffBonus, 100))
}

export function summarizeCandidate(name: string, scores: number[]): string {
	const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
	return `${name || 'Candidate'} demonstrated strengths in React/Node fundamentals with an overall score of ${avg}.`;
}


