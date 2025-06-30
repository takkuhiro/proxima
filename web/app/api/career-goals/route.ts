import { createCareerGoals, deleteCareerGoals, getCareerGoals } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
	const userId = req.nextUrl.searchParams.get("userId")
	if (!userId) {
		return NextResponse.json({ error: "userId is required" }, { status: 400 })
	}
	const careerGoals = await getCareerGoals(userId)
	return NextResponse.json(careerGoals)
}

export async function POST(req: NextRequest) {
	const body = await req.json()
	const { userId, careerTitle, careerBody, targetPeriod } = body
	if (!userId || !careerTitle || !careerBody || !targetPeriod) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 })
	}
	const result = await createCareerGoals(userId, [
		{
			userId: userId,
			careerTitle,
			careerBody,
			targetPeriod,
		},
	])
	return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
	const userId = req.nextUrl.searchParams.get("userId")
	const id = req.nextUrl.searchParams.get("id")
	if (!userId || !id) {
		return NextResponse.json(
			{ error: "userId and id are required" },
			{ status: 400 },
		)
	}
	await deleteCareerGoals(userId, id)
	return NextResponse.json({ ok: true })
}
