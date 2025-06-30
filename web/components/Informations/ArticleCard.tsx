import type { Article } from "@/app/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { ExternalLink, PlusCircle, Star } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface ArticleCardProps {
	article: Article
	userId: string
	onFavoriteChange?: (id: string, newFavorite: boolean) => void
}

export function ArticleCard({
	article,
	userId,
	onFavoriteChange,
}: ArticleCardProps) {
	const {
		title,
		body,
		url,
		category,
		recommendLevel,
		favorite,
		recommendSentence,
	} = article

	const [isFavorite, setIsFavorite] = useState(favorite)
	const [loading, setLoading] = useState(false)
	const [addingTask, setAddingTask] = useState(false)

	// 本文を100文字に制限
	const truncatedBody =
		body.length > 100 ? `${body.substring(0, 100)}...` : body
	const truncatedRecommendSentence =
		recommendSentence && recommendSentence.length > 20
			? `${recommendSentence.substring(0, 20)}...`
			: recommendSentence

	const handleFavoriteClick = async () => {
		if (loading) return
		setLoading(true)
		try {
			const res = await fetch(`/api/information?userId=${userId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: article.id, favorite: !isFavorite }),
			})
			if (res.ok) {
				setIsFavorite((prev) => !prev)
				onFavoriteChange?.(article.id, !isFavorite)
			}
		} finally {
			setLoading(false)
		}
	}

	const handleAddTaskClick = async () => {
		if (addingTask || !userId) return
		setAddingTask(true)
		try {
			const payload = {
				userId,
				title: `${title}を読む`,
				description: "ニュースから追加しました",
				category,
				estimatedTime: "10分",
			}
			const res = await fetch("/api/tasks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			})
			if (res.ok) {
				toast({
					title: "タスク追加",
					description: "タスクを追加しました。",
				})
			} else {
				const err = await res.json().catch(() => ({}))
				console.error("Failed to add task", err)
			}
		} catch (e) {
			console.error(e)
		} finally {
			setAddingTask(false)
		}
	}

	return (
		<Card className="h-full flex flex-col relative">
			<CardHeader>
				<div className="flex justify-between items-start gap-4">
					<h2 className="text-xl font-semibold">{title}</h2>
					<Badge variant="outline" className="shrink-0">
						{category}
					</Badge>
					<button
						type="button"
						onClick={handleFavoriteClick}
						disabled={loading}
						aria-label={isFavorite ? "お気に入り解除" : "お気に入り追加"}
						className="items-end"
					>
						<Star
							className={`h-6 w-6 ${isFavorite ? "fill-pink-400 text-pink-400" : "text-gray-300"}`}
						/>
					</button>
				</div>
			</CardHeader>
			<CardContent className="flex-grow flex flex-col">
				<p className="text-muted-foreground">{truncatedBody}</p>
				{recommendSentence && (
					<div className="flex items-start gap-2 mt-auto pt-4">
						<Avatar className="h-10 w-10">
							<AvatarFallback>AI</AvatarFallback>
							<AvatarImage src="/icons/Misaki.png" />
						</Avatar>
						<div className="text-sm rounded-lg px-4 py-2 bg-muted max-w-full whitespace-pre-wrap break-words">
							{truncatedRecommendSentence}
						</div>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex justify-between items-center border-t pt-4">
				<div className="flex items-center gap-2">
					{[1, 2, 3, 4, 5].map((num) => (
						<Star
							key={`star-${num}`}
							className={`h-4 w-4 ${num <= recommendLevel ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
						/>
					))}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleAddTaskClick}
						disabled={addingTask}
						className="flex items-center gap-1"
					>
						<PlusCircle className="h-4 w-4" />
						タスク追加
					</Button>
					<Button asChild variant="ghost" size="sm">
						<Link
							href={url}
							target="_blank"
							className="flex items-center gap-1"
						>
							<ExternalLink className="h-3 w-3 ml-1" />
							詳細
						</Link>
					</Button>
				</div>
			</CardFooter>
		</Card>
	)
}
