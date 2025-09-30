export type Difficulty = "easy" | "medium" | "hard";

export interface CandidateProfile {
	name: string;
	email: string;
	phone: string;
}

export interface ChatMessage {
	id: string;
	role: "system" | "assistant" | "user";
	content: string;
	timestamp: number;
}

export interface Question {
	id: string;
	difficulty: Difficulty;
	text: string;
	seconds: number;
}

export interface AnswerRecord {
	questionId: string;
	answerText: string;
	submittedAt: number;
	score: number | null;
}

export interface Candidate {
	id: string;
	profile: CandidateProfile;
	questions: Question[];
	answers: AnswerRecord[];
	finalScore: number | null;
	summary: string | null;
	chat: ChatMessage[];
	createdAt: number;
}

export type InterviewStatus = "idle" | "collecting_profile" | "in_progress" | "paused" | "completed";

export interface SessionState {
	currentCandidateId: string | null;
	status: InterviewStatus;
	currentIndex: number; // 0..5 for 6 questions
	welcomeBackNeeded: boolean;
	theme: "light" | "dark";
}


