"use client"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/components/ui/card"
import { useUserId } from "@/hooks/auth"
import { Loader2, Newspaper, Pause, Play } from "lucide-react"
import { useState } from "react"

export default function NewsGenerator() {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [signedUrl, setSignedUrl] = useState<string | null>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
	const userId = useUserId()

	const generateNews = async () => {
		if (isLoading) return
		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch("/api/news", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ user_id: userId }),
			})

			if (!response.ok) {
				throw new Error("ニュース生成に失敗しました")
			}

			const data = await response.json()
			setSignedUrl(data.signed_url)
			const newAudio = new Audio(data.signed_url)
			setAudio(newAudio)
		} catch (error) {
			console.error("エラー:", error)
			setError("ニュース生成中にエラーが発生しました")
		} finally {
			setIsLoading(false)
		}
	}

	const togglePlay = () => {
		if (!audio) return

		if (isPlaying) {
			audio.pause()
		} else {
			audio.play()
		}
		setIsPlaying(!isPlaying)
	}

	return (
		<Card className="w-full">
			<CardContent className="p-4">
				<div className="flex items-center gap-8">
					<div className="flex-1">
						<CardTitle className="text-lg">Proxima News</CardTitle>
						<CardDescription className="mt-1">
							Proximaが今日のニュースとタスクについてご紹介します
						</CardDescription>
					</div>
					<div className="flex gap-4">
						<Button
							onClick={generateNews}
							size="lg"
							className="h-16 px-6 rounded-full"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className="h-6 w-6 animate-spin mr-2" />
									生成中...
								</>
							) : (
								<>
									<Newspaper className="h-6 w-6 mr-2" />
									生成する
								</>
							)}
						</Button>

						<Button
							onClick={togglePlay}
							size="lg"
							className="h-16 px-6 rounded-full"
							disabled={!audio || isLoading}
						>
							{isPlaying ? (
								<>
									<Pause className="h-6 w-6 mr-2" />
									一時停止
								</>
							) : (
								<>
									<Play className="h-6 w-6 mr-2" />
									再生する
								</>
							)}
						</Button>
					</div>
				</div>

				{error && (
					<p className="text-sm text-red-500 text-center mt-4">{error}</p>
				)}
			</CardContent>
		</Card>
	)
}
