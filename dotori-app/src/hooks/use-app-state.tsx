"use client";

import {
	createContext,
	type Dispatch,
	type ReactNode,
	useContext,
	useReducer,
} from "react";
import type {
	ActionState,
	ChatMessage,
	ToastData,
	UserProfile,
} from "@/types/dotori";

interface AppState {
	user: UserProfile | null;
	chatMessages: ChatMessage[];
	actionState: ActionState;
	toasts: ToastData[];
	dismissedNBAs: string[];
}

type AppAction =
	| { type: "SET_USER"; payload: UserProfile }
	| { type: "ADD_MESSAGE"; payload: ChatMessage }
	| { type: "UPDATE_LAST_MESSAGE"; payload: Partial<ChatMessage> }
	| { type: "SET_ACTION_STATUS"; payload: ActionState }
	| { type: "ADD_TOAST"; payload: ToastData }
	| { type: "REMOVE_TOAST"; payload: string }
	| { type: "DISMISS_NBA"; payload: string };

const initialState: AppState = {
	user: null,
	chatMessages: [],
	actionState: { status: "idle" },
	toasts: [],
	dismissedNBAs: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
	switch (action.type) {
		case "SET_USER":
			return { ...state, user: action.payload };
		case "ADD_MESSAGE":
			return {
				...state,
				chatMessages: [...state.chatMessages, action.payload],
			};
		case "UPDATE_LAST_MESSAGE": {
			const msgs = [...state.chatMessages];
			const last = msgs[msgs.length - 1];
			if (last) msgs[msgs.length - 1] = { ...last, ...action.payload };
			return { ...state, chatMessages: msgs };
		}
		case "SET_ACTION_STATUS":
			return { ...state, actionState: action.payload };
		case "ADD_TOAST":
			return { ...state, toasts: [...state.toasts.slice(-2), action.payload] };
		case "REMOVE_TOAST":
			return {
				...state,
				toasts: state.toasts.filter((t) => t.id !== action.payload),
			};
		case "DISMISS_NBA":
			return {
				...state,
				dismissedNBAs: [...state.dismissedNBAs, action.payload],
			};
		default:
			return state;
	}
}

const AppContext = createContext<{
	state: AppState;
	dispatch: Dispatch<AppAction>;
}>({ state: initialState, dispatch: () => null });

export function AppProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(appReducer, initialState);
	return (
		<AppContext.Provider value={{ state, dispatch }}>
			{children}
		</AppContext.Provider>
	);
}

export function useAppState() {
	return useContext(AppContext);
}
