import { NextResponse } from "next/server"

export async function POST(request: Request) {
	const { user_id } = await request.json()
	try {
		const response = await fetch(
			`${process.env.GOOGLE_CLOUD_RUN_FUNCTIONS_URI}/news`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ user_id }),
			},
		)

		if (!response.ok) {
			throw new Error("ニュース生成に失敗しました")
		}

		const data = await response.json()
		return NextResponse.json(data)
	} catch (error) {
		console.error("エラー:", error)
		return NextResponse.json(
			{ error: "ニュース生成中にエラーが発生しました" },
			{ status: 500 },
		)
	}
}
