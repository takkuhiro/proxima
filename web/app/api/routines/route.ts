import {
	createRoutine,
	deleteRoutine,
	getTodaysRoutines,
	updateRoutineCompletion,
} from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
	const userId = req.nextUrl.searchParams.get("userId")
	if (!userId) {
		return NextResponse.json({ error: "userId is required" }, { status: 400 })
	}
	return NextResponse.json(await getTodaysRoutines(userId))
}

export async function POST(req: NextRequest) {
	const body = await req.json()
	const { userId, title, description, frequency, time, category } = body
	if (!userId || !title || !frequency || !category) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 })
	}
	const result = await createRoutine({
		userId,
		title,
		description,
		frequency,
		time,
		category,
	})
	return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
	const id = req.nextUrl.searchParams.get("id")
	if (!id) {
		return NextResponse.json({ error: "id is required" }, { status: 400 })
	}
	const { userId, completed } = await req.json()
	const result = await updateRoutineCompletion(userId, id, completed)
	if (!result) {
		return NextResponse.json({ error: "Routine not found" }, { status: 404 })
	}
	return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
	const id = req.nextUrl.searchParams.get("id")
	if (!id) {
		return NextResponse.json({ error: "id is required" }, { status: 400 })
	}
	await deleteRoutine(id)
	return NextResponse.json({ ok: true })
}
