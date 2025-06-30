"use client"
import { QuestCard } from "@/components/DailyQuests/QuestCard"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { useUserId } from "@/hooks/auth"
import { fetchTasks } from "@/hooks/tasks"
import { hasTaskFetchedAtom, questsAtom } from "@/lib/state"
import { useAtom } from "jotai"
import { useEffect, useState } from "react"
import { PulseLoader } from "react-spinners"

export function Review() {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
	const [quests, setQuests] = useAtom(questsAtom)
	const [hasTaskFetched, setHasTaskFetched] = useAtom(hasTaskFetchedAtom)
	const [isLoading, setIsLoading] = useState(false)
	const userId = useUserId()

	useEffect(() => {
		if (userId && !hasTaskFetched) {
			setIsLoading(true)
			fetchTasks(userId)
				.then((data) => {
					setQuests(data)
				})
				.finally(() => {
					setIsLoading(false)
					setHasTaskFetched(true)
				})
		}
	}, [userId, hasTaskFetched, setQuests, setHasTaskFetched])

	// 日付をYYYY-MM-DD形式に変換
	const formatDate = (date: Date | undefined) => {
		if (!date) return undefined
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, "0")
		const day = String(date.getDate()).padStart(2, "0")
		return `${year}-${month}-${day}`
	}

	// 指定日のクエスト一覧を取得
	const getTasksForDate = (date: Date) =>
		quests.filter((q) => {
			const questDate = new Date(q.createdAt)
			return formatDate(questDate) === formatDate(date)
		})

	// 指定日の進捗（完了数・合計数・達成率）を取得
	const getDateStats = (date: Date) => {
		const tasks = getTasksForDate(date)
		const total = tasks.length
		const completed = tasks.filter((t) => t.completed).length
		const rate = total > 0 ? Math.round((completed / total) * 100) : 0
		return { completed, total, rate }
	}

	// 選択日のクエストのみ抽出
	const questsForSelectedDate = quests.filter((q) => {
		const questDate = new Date(q.createdAt)
		return formatDate(questDate) === formatDate(selectedDate)
	})

	return (
		<div className="space-y-6">
			{isLoading && (
				<div className="flex flex-col justify-center items-center py-8">
					<PulseLoader color="#888" size={12} />
					<p className="text-muted-foreground mt-4">読み込み中...</p>
				</div>
			)}
			{!isLoading && (
				<div className="flex flex-col md:flex-row gap-8 w-full">
					{/* 左: カレンダー */}
					<div className="md:w-1/3 w-full">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={setSelectedDate}
							captionLayout="dropdown"
							className="rounded-lg border [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]" // "rounded-md border shadow-sm"
							components={{
								DayButton: ({ children, modifiers, day, ...props }) => {
									const stats = getDateStats(day.date)
									const hasTask = stats.total > 0
									return (
										<CalendarDayButton
											day={day}
											modifiers={modifiers}
											{...props}
										>
											{/* 日付数字 */}
											<span
												className={
													hasTask && stats.rate === 100
														? "text-green-500"
														: hasTask && stats.rate > 0
															? "text-yellow-500"
															: hasTask
																? "text-red-500"
																: ""
												}
											>
												{children}
											</span>
										</CalendarDayButton>
									)
								},
							}}
						/>
					</div>
					{/* 右: 選択日のクエスト */}
					<div className="flex-1 space-y-4">
						<h1 className="text-2xl font-bold mb-4">
							{selectedDate
								? `${formatDate(selectedDate)} のクエスト`
								: "日付を選択してください"}
						</h1>
						{questsForSelectedDate.length > 0 ? (
							questsForSelectedDate.map((quest) => (
								<QuestCard
									key={quest.id}
									quest={quest}
									onToggleComplete={() => {}}
									onDelete={() => {}}
									onMoveToRoutine={() => {}}
								/>
							))
						) : (
							<div className="text-muted-foreground">
								この日にクエストはありません
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
