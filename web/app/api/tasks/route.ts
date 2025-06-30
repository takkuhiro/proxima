import {
	createTask,
	deleteTask,
	getDailyTasks,
	updateTaskCompletion,
} from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

// GET: /api/tasks?userId=xxx
export async function GET(req: NextRequest) {
	const userId = req.nextUrl.searchParams.get("userId")
	if (!userId) {
		return NextResponse.json({ error: "userId is required" }, { status: 400 })
	}
	return NextResponse.json(await getDailyTasks(userId))
}

// POST: /api/tasks
export async function POST(req: NextRequest) {
	const body = await req.json()
	const { userId, title, description, category, estimatedTime } = body
	if (!userId || !title || !category || !estimatedTime) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 })
	}
	const result = await createTask({
		userId,
		title,
		description,
		category,
		estimatedTime,
	})
	return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
	const id = req.nextUrl.searchParams.get("id")
	if (!id) {
		return NextResponse.json({ error: "id is required" }, { status: 400 })
	}
	const { completed } = await req.json()
	const result = await updateTaskCompletion(id, completed)
	return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
	const id = req.nextUrl.searchParams.get("id")
	if (!id) {
		return NextResponse.json({ error: "id is required" }, { status: 400 })
	}
	await deleteTask(id)
	return NextResponse.json({ ok: true })
}
