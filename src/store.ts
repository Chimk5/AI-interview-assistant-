import { configureStore, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import type { Candidate, CandidateProfile, ChatMessage, SessionState, Question, AnswerRecord, InterviewStatus } from "./types";
import { nanoid } from "nanoid";

interface RootStateShape {
	candidates: Candidate[];
	session: SessionState;
}

const initialSession: SessionState = {
	currentCandidateId: null,
	status: "idle",
	currentIndex: 0,
	welcomeBackNeeded: false,
	theme: "light",
};

const sessionSlice = createSlice({
	name: "session",
	initialState: initialSession,
	reducers: {
		setStatus(state, action: PayloadAction<InterviewStatus>) {
			state.status = action.payload;
		},
		setCurrentCandidate(state, action: PayloadAction<string | null>) {
			state.currentCandidateId = action.payload;
		},
		setCurrentIndex(state, action: PayloadAction<number>) {
			state.currentIndex = action.payload;
		},
		setWelcomeBack(state, action: PayloadAction<boolean>) {
			state.welcomeBackNeeded = action.payload;
		},
			setTheme(state, action: PayloadAction<"light" | "dark">) {
				state.theme = action.payload;
			},
	},
});

const candidatesSlice = createSlice({
	name: "candidates",
	initialState: [] as Candidate[],
	reducers: {
		createCandidate: {
			reducer(state, action: PayloadAction<Candidate>) {
				state.push(action.payload);
			},
			prepare(profile: CandidateProfile) {
				return {
					payload: {
						id: nanoid(),
						profile,
						questions: [],
						answers: [],
						finalScore: null,
						summary: null,
						chat: [],
						createdAt: Date.now(),
					} as Candidate,
				};
			},
		},
		appendChat(state, action: PayloadAction<{ candidateId: string; message: ChatMessage }>) {
			const found = state.find(c => c.id === action.payload.candidateId);
			if (found) found.chat.push(action.payload.message);
		},
		setQuestions(state, action: PayloadAction<{ candidateId: string; questions: Question[] }>) {
			const found = state.find(c => c.id === action.payload.candidateId);
			if (found) found.questions = action.payload.questions;
		},
		addAnswer(state, action: PayloadAction<{ candidateId: string; answer: AnswerRecord }>) {
			const found = state.find(c => c.id === action.payload.candidateId);
			if (found) found.answers.push(action.payload.answer);
		},
		finalize(state, action: PayloadAction<{ candidateId: string; finalScore: number | null; summary: string }>) {
			const found = state.find(c => c.id === action.payload.candidateId);
			if (found) {
				found.finalScore = action.payload.finalScore;
				found.summary = action.payload.summary;
			}
		},
		updateProfile(state, action: PayloadAction<{ candidateId: string; profile: Partial<CandidateProfile> }>) {
			const found = state.find(c => c.id === action.payload.candidateId);
			if (found) found.profile = { ...found.profile, ...action.payload.profile };
		},
		normalizeScores(state) {
			for (const c of state) {
				if (c.finalScore === 4) {
					c.finalScore = null;
				}
			}
		},
	},
});

const rootPersistConfig = {
	key: "root",
	storage,
	whitelist: ["candidates", "session"],
};

const rootReducer = {
	candidates: candidatesSlice.reducer,
	session: sessionSlice.reducer,
};

export const { setStatus, setCurrentCandidate, setCurrentIndex, setWelcomeBack, setTheme } = sessionSlice.actions;
export const { createCandidate, appendChat, setQuestions, addAnswer, finalize, updateProfile, normalizeScores } = candidatesSlice.actions;

export const store = configureStore({
	reducer: persistReducer(rootPersistConfig, (state: any, action: any) => ({
		candidates: rootReducer.candidates(state?.candidates, action),
		session: rootReducer.session(state?.session, action),
	}) as any) as any,
	middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export const persistor = persistStore(store);

export type RootState = RootStateShape;
export type AppDispatch = typeof store.dispatch;


