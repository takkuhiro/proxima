import type { Timestamp } from "firebase/firestore"

export const categories = [
	"学習",
	"開発",
	"調査",
	"SNS",
	"OSS",
	"ブログ",
	"イベント",
	"趣味",
	"その他",
] as const

export type User = {
	id: string
	email: string
	createdAt: Timestamp
	status: "creating" | "waitingForTutorial" | "created"
	nickname?: string
}

export type ChatMessage = {
	id: string
	role: string
	message: string
	createdAt?: string
}

export type Quest = {
	id: string
	userId: string
	title: string
	description: string
	recommend: string
	category: string
	estimatedTime: string
	completed: boolean
	createdAt: string
}

export type CareerGoal = {
	id: string
	userId: string
	careerTitle: string
	careerBody: string
	targetPeriod: string
	createdAt: string
	deleted: boolean
}

// tutorial
export interface Initiative {
	id: string
	userId: string
	title: string
	body: string
	targetPeriod: string
	createdAt: string
	deleted: boolean
}

export interface ProfileData {
	// 基本プロフィール
	nickname: string
	gender: string
	age: string
	location: string
	iotDeviceUrl?: string

	// キャリア
	careerGoals: Omit<CareerGoal, "createdAt" | "deleted">[]

	// プラン
	initiatives: Omit<Initiative, "createdAt" | "deleted">[]

	// スキル・経験
	skills: string[]
	currentRole: string
	experience: string
	projects: string

	// 学習スタイル
	learningMethods: string[]
	dailyStudyTime: string
}

// chat
export type FunctionCall = {
	id: string
	args: {
		[key: string]: string | number | boolean | null
	}
	name: string
}

export type FunctionResponse = {
	id: string
	name: string
	response: {
		[key: string]: string | number | boolean | null
	}
}

export type Message = {
	id: string
	content?: string
	loading: boolean
	role: "user" | "model"
	status: "success" | "failed"
	createdAt: Timestamp
	agent: string
	functionCall?: FunctionCall
	functionResponse?: FunctionResponse
}

export type Article = {
	id: string
	userId: string
	url: string
	category: string
	title: string
	body: string
	recommendLevel: number
	recommendSentence: string
	favorite: boolean
	createdAt: string
}

export type Routine = {
	id: string
	userId: string
	title: string
	description: string
	frequency: string
	time: string
	streak: number
	category: string
	completed: boolean
	createdAt: string
	deleted: boolean
}

export type Advice = {
	id: string
	userId: string
	markdown: string
	createdAt: string
	deleted: boolean
}

export type VrmModelName =
	| "alicia"
	| "kazuma"
	| "yukari"
	| "yukari_2"
	| "yukari_3"
	| "yukari_4"
	| "yukari_5"
	| "yukari_6"
	| "yukari_7"
	| "yukari_8"
	| "yukari_9"
	| "yukari_10"
