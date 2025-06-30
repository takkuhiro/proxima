import type { CareerGoal } from "@/app/types"
import {
	createCareerGoals,
	createInitiatives,
	createUserProfile,
} from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
	const body = await req.json()
	const { userId, profile } = body
	if (!userId || !profile) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 })
	}
	await Promise.all([
		createUserProfile(userId, profile),
		createCareerGoals(userId, profile.careerGoals),
		createInitiatives(userId, profile.initiatives),
	])

	const careerGoalsString = profile.careerGoals
		.map((goal: CareerGoal) => `${goal.careerTitle}: ${goal.careerBody}`)
		.join("\n")

	await Promise.all([
		// apiサーバーに送信してcareerGoalsを元にLLMでinitiativesを作成する
		fetch(`${process.env.GOOGLE_CLOUD_RUN_FUNCTIONS_URI}/create-initiatives`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, careerGoals: careerGoalsString }),
		}),

		// 作成した情報を元にadviceを作成する
		fetch(`${process.env.GOOGLE_CLOUD_RUN_FUNCTIONS_URI}/advice`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId }),
		}),

		// 作成した情報をもとにmanuscriptを作成する
		fetch(`${process.env.GOOGLE_CLOUD_RUN_FUNCTIONS_URI}/manuscript`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId }),
		}),
	])

	return NextResponse.json({ ok: true })
}
