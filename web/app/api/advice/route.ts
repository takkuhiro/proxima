import { getAdvice } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest): Promise<NextResponse> {
	const userId = req.nextUrl.searchParams.get("userId")
	if (!userId) {
		return NextResponse.json({ error: "userId is required" }, { status: 400 })
	}
	return NextResponse.json(await getAdvice(userId))
}
