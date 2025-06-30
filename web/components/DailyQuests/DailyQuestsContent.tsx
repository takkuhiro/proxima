"use client"

import type { Quest, Routine } from "@/app/types"
import { categories } from "@/app/types"
import { EmptyQuestCard } from "@/components/DailyQuests/EmptyQuestCard"
import { NewQuestForm } from "@/components/DailyQuests/NewQuestForm"
import { QuestCard } from "@/components/DailyQuests/QuestCard"
import { Button } from "@/components/ui/button"
import { useUserId } from "@/hooks/auth"
import {
	createTask,
	deleteTask,
	fetchTasks,
	updateTaskCompletion,
} from "@/hooks/tasks"
import { toast } from "@/hooks/use-toast"
import { hasTaskFetchedAtom, questsAtom, routinesAtom } from "@/lib/state"
import { useAtom } from "jotai"
import { PlusCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { PulseLoader } from "react-spinners"

export function DailyQuestsContent() {
	const [quests, setQuests] = useAtom(questsAtom)
	const [routines, setRoutines] = useAtom(routinesAtom)
	const [isAdding, setIsAdding] = useState(false)
	const [newQuest, setNewQuest] = useState<
		Omit<Quest, "id" | "userId" | "recommend" | "completed" | "createdAt">
	>({
		title: "",
		description: "",
		category: "",
		estimatedTime: "",
	})
	const userId = useUserId()
	const [isLoading, setIsLoading] = useState(false)
	const [hasTaskFetched, setHasTaskFetched] = useAtom(hasTaskFetchedAtom)

	// 今日のクエストに絞る
	const todaysQuests = quests.filter((q) => {
		const created = new Date(q.createdAt)
		const today = new Date()
		return created.toDateString() === today.toDateString()
	})

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

	const handleAddQuest = async () => {
		if (
			userId &&
			newQuest.title &&
			newQuest.category &&
			newQuest.estimatedTime
		) {
			const quest: Omit<Quest, "id" | "recommend" | "completed" | "createdAt"> =
				{
					userId: userId,
					title: newQuest.title,
					description: newQuest.description,
					category: newQuest.category,
					estimatedTime: newQuest.estimatedTime,
				}
			const createdQuest = await createTask(quest)
			setQuests([createdQuest, ...quests])
			setNewQuest({
				title: "",
				description: "",
				category: "",
				estimatedTime: "",
			})
			setIsAdding(false)
			toast({
				title: "クエスト追加",
				description: "新しいデイリークエストが追加されました。",
			})
		}
	}

	const handleToggleComplete = async (id: string) => {
		const quest = quests.find((q) => q.id === id)
		if (!quest) return
		const updated = await updateTaskCompletion(id, !quest.completed)
		setQuests(
			quests.map((q) =>
				q.id === id ? { ...q, completed: updated.completed } : q,
			),
		)
	}

	const handleDeleteQuest = async (id: string) => {
		await deleteTask(id)
		setQuests(quests.filter((q) => q.id !== id))
		toast({
			title: "クエスト削除",
			description: "デイリークエストが削除されました。",
			variant: "destructive",
		})
	}

	const handleMoveToRoutine = async (quest: Quest) => {
		if (!userId) return
		try {
			const res = await fetch("/api/habit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id: quest.id, userId }),
			})
			if (!res.ok) throw new Error("Failed to move quest")
			const routine: Routine = await res.json()
			// クエストリストから削除
			setQuests(quests.filter((q) => q.id !== quest.id))
			// ルーティーンに追加
			setRoutines([...routines, routine])
			toast({
				title: "移動完了",
				description: "クエストをルーティーンに移動しました。",
			})
		} catch (e) {
			console.error(e)
			toast({
				title: "エラー",
				description: "移動に失敗しました。",
				variant: "destructive",
			})
		}
	}

	const estimatedTimes = ["5分", "10分", "15分", "30分", "1時間", "1時間以上"]

	return (
		<div className="space-y-6">
			{isLoading && (
				<div className="flex flex-col justify-center items-center py-8">
					<PulseLoader color="#888" size={12} />
					<p className="text-muted-foreground mt-4">読み込み中...</p>
				</div>
			)}
			{!isLoading && (
				<>
					<div className="space-y-4">
						{todaysQuests.length === 0 ? (
							<EmptyQuestCard onAddQuest={() => setIsAdding(true)} />
						) : (
							todaysQuests.map((quest) => (
								<QuestCard
									key={quest.id}
									quest={quest}
									onToggleComplete={handleToggleComplete}
									onDelete={handleDeleteQuest}
									onMoveToRoutine={handleMoveToRoutine}
								/>
							))
						)}
					</div>

					{!isAdding && (
						<div className="flex justify-center mt-4">
							<Button variant="outline" onClick={() => setIsAdding(true)}>
								<PlusCircle className="mr-2 h-4 w-4" />
								クエストを追加
							</Button>
						</div>
					)}

					{isAdding && (
						<NewQuestForm
							newQuest={newQuest}
							setNewQuest={
								setNewQuest as (
									q: Omit<
										Quest,
										"id" | "userId" | "recommend" | "completed" | "createdAt"
									>,
								) => void
							}
							categories={categories}
							estimatedTimes={estimatedTimes}
							onCancel={() => setIsAdding(false)}
							onSave={handleAddQuest}
							saveDisabled={
								!newQuest.title || !newQuest.category || !newQuest.estimatedTime
							}
						/>
					)}
				</>
			)}
		</div>
	)
}
