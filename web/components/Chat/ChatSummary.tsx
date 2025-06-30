"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Calendar, ListTodo, Target } from "lucide-react"
import { useEffect, useState } from "react"

// 各コンポーネントからデータを取得するためのインターフェース
// 実際のアプリケーションでは、これらのデータはAPIやグローバルステートから取得します
interface ChatSummaryProps {
	latestGoalTitle?: string
	initiativesProgress?: number
	questsCompletionRate?: number
	highestRoutineStreak?: number
}

export function ChatSummary({
	latestGoalTitle = "外資企業のAIフルスタックエンジニア",
	initiativesProgress = 33,
	questsCompletionRate = 67,
	highestRoutineStreak = 10,
}: ChatSummaryProps) {
	const [isLoading, setIsLoading] = useState(true)

	// データ読み込みのシミュレーション
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false)
		}, 500)
		return () => clearTimeout(timer)
	}, [])

	return (
		<div className="w-full">
			<Card className="bg-background/80 backdrop-blur-sm border-muted">
				<div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x">
					<div className="p-3 flex items-center gap-2">
						<Target className="h-4 w-4 text-primary flex-shrink-0" />
						<div className="min-w-0">
							<p className="text-xs text-muted-foreground">目指すキャリア</p>
							{isLoading ? (
								<Skeleton className="h-4 w-32" />
							) : (
								<p
									className="text-sm font-medium truncate"
									title={latestGoalTitle}
								>
									{latestGoalTitle}
								</p>
							)}
						</div>
					</div>

					{/* 取り組みの平均達成率 */}
					<div className="p-3 flex items-center gap-2">
						<ListTodo className="h-4 w-4 text-primary flex-shrink-0" />
						<div>
							<p className="text-xs text-muted-foreground">取り組み達成率</p>
							{isLoading ? (
								<Skeleton className="h-4 w-16" />
							) : (
								<p className="text-sm font-medium">{initiativesProgress}%</p>
							)}
						</div>
					</div>

					{/* デイリークエストの達成率 */}
					<div className="p-3 flex items-center gap-2">
						<Calendar className="h-4 w-4 text-primary flex-shrink-0" />
						<div>
							<p className="text-xs text-muted-foreground">クエスト達成率</p>
							{isLoading ? (
								<Skeleton className="h-4 w-16" />
							) : (
								<p className="text-sm font-medium">{questsCompletionRate}%</p>
							)}
						</div>
					</div>

					{/* ルーティーンの継続日数 */}
					<div className="p-3 flex items-center gap-2">
						<Activity className="h-4 w-4 text-primary flex-shrink-0" />
						<div>
							<p className="text-xs text-muted-foreground">最長継続日数</p>
							{isLoading ? (
								<Skeleton className="h-4 w-16" />
							) : (
								<p className="text-sm font-medium">{highestRoutineStreak}日</p>
							)}
						</div>
					</div>
				</div>
			</Card>
		</div>
	)
}
