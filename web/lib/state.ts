import { atom } from 'jotai';

import { User, Message, Quest, Article, Routine, CareerGoal, Initiative, Advice } from '@/app/types';

export const userAtom = atom<User | null>(null);
export const userIdAtom = atom<string | null>(null);
export const sessionIdAtom = atom<string | null>(null);
export const chatMessagesAtom = atom<Message[]>([]);
export const questsAtom = atom<Quest[]>([]);
export const articlesAtom = atom<Article[]>([]);
export const routinesAtom = atom<Routine[]>([]);
export const hasTaskFetchedAtom = atom<Boolean>(false);
export const hasRoutineFetchedAtom = atom<Boolean>(false);
export const careerGoalsAtom = atom<CareerGoal[]>([]);
export const hasCareerGoalsFetchedAtom = atom<Boolean>(false);
export const initiativesAtom = atom<Initiative[]>([]);
export const hasInitiativesFetchedAtom = atom<boolean>(false);
export const adviceAtom = atom<Advice | null>(null);
export const hasAdviceFetchedAtom = atom<boolean>(false);
export const AgentAtom = atom<string>("Misaki");
