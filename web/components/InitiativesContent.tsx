"use client"

import { CardFooter } from "@/components/ui/card"

import { CardContent } from "@/components/ui/card"

import { CardDescription } from "@/components/ui/card"

import { CardTitle } from "@/components/ui/card"

import { CardHeader } from "@/components/ui/card"

import type { Initiative } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUserId } from "@/hooks/auth"
import {
	createInitiative,
	deleteInitiative,
	fetchInitiatives,
} from "@/hooks/initiatives"
import { hasInitiativesFetchedAtom, initiativesAtom } from "@/lib/state"
import { useAtom } from "jotai"
import { PlusCircle, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { PulseLoader } from "react-spinners"

export function InitiativesContent() {
	const userId = useUserId()
	const [initiatives, setInitiatives] = useAtom(initiativesAtom)
	const [hasInitiativesFetched, setHasInitiativesFetched] = useAtom(
		hasInitiativesFetchedAtom,
	)
	const [isAdding, setIsAdding] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [newInitiative, setNewInitiative] = useState<
		Omit<Initiative, "id" | "createdAt" | "deleted">
	>({
		title: "",
		body: "",
		targetPeriod: "",
		userId: userId || "",
	})

	useEffect(() => {
		if (!userId || hasInitiativesFetched) return
		setIsLoading(true)
		fetchInitiatives(userId)
			.then((data) => {
				setInitiatives(data)
				setHasInitiativesFetched(true)
			})
			.finally(() => setIsLoading(false))
	}, [userId, hasInitiativesFetched, setInitiatives, setHasInitiativesFetched])

	const handleAddInitiative = async () => {
		if (
			!userId ||
			!newInitiative.title ||
			!newInitiative.body ||
			!newInitiative.targetPeriod
		)
			return
		setIsLoading(true)
		await createInitiative({ ...newInitiative, userId })
		setIsAdding(false)
		setNewInitiative({ title: "", body: "", targetPeriod: "", userId })
		const updated = await fetchInitiatives(userId)
		setInitiatives(updated)
		setHasInitiativesFetched(true)
		setIsLoading(false)
	}

	const handleDeleteInitiative = async (id: string) => {
		if (!userId) return
		setIsLoading(true)
		await deleteInitiative(userId, id)
		const updated = await fetchInitiatives(userId)
		setInitiatives(updated)
		setHasInitiativesFetched(true)
		setIsLoading(false)
	}

	const periods = [
		"1ヶ月後",
		"3ヶ月後",
		"半年後",
		"1年後",
		"2年後",
		"3年後",
		"5年後",
		"長期的",
	]

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center py-8">
				<PulseLoader color="#888" size={12} />
				<p className="text-muted-foreground mt-4">読み込み中...</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				{initiatives.map((initiative) => (
					<Card key={initiative.id}>
						<div className="flex flex-col md:flex-row md:items-center">
							<div className="flex-grow p-4 md:p-6">
								<div className="flex justify-between items-start mb-2">
									<div>
										<h3 className="font-medium text-lg">{initiative.title}</h3>
										<p className="text-sm text-muted-foreground">
											期限: {initiative.targetPeriod}
										</p>
									</div>
								</div>
								<p className="text-sm mb-4">{initiative.body}</p>
							</div>
							<div className="p-4 md:pr-6 flex md:flex-col justify-end">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 text-destructive"
									onClick={() => handleDeleteInitiative(initiative.id)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</Card>
				))}
			</div>

			{initiatives.length === 0 && (
				<Card className="bg-muted/50">
					<CardContent className="flex flex-col items-center justify-center p-6">
						<p className="text-muted-foreground mb-4">取り組みがありません</p>
						<Button variant="outline" onClick={() => setIsAdding(true)}>
							<PlusCircle className="mr-2 h-4 w-4" />
							取り組みを追加
						</Button>
					</CardContent>
				</Card>
			)}

			{initiatives.length > 0 && !isAdding && (
				<div className="flex justify-center">
					<Button variant="outline" onClick={() => setIsAdding(true)}>
						<PlusCircle className="mr-2 h-4 w-4" />
						取り組みを追加
					</Button>
				</div>
			)}

			{isAdding && (
				<Card>
					<CardHeader>
						<CardTitle>新しい取り組み</CardTitle>
						<CardDescription>
							3ヶ月程度で達成できる中期的な目標を設定しましょう
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="title" className="text-sm font-medium">
								タイトル
							</label>
							<Input
								id="title"
								value={newInitiative.title}
								onChange={(e) =>
									setNewInitiative({ ...newInitiative, title: e.target.value })
								}
								placeholder="取り組みのタイトル"
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="body" className="text-sm font-medium">
								詳細
							</label>
							<Textarea
								id="body"
								value={newInitiative.body}
								onChange={(e) =>
									setNewInitiative({ ...newInitiative, body: e.target.value })
								}
								placeholder="取り組みの詳細な説明"
								rows={3}
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="targetPeriod" className="text-sm font-medium">
								目標時期
							</label>
							<Select
								value={newInitiative.targetPeriod}
								onValueChange={(value) =>
									setNewInitiative({ ...newInitiative, targetPeriod: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="目標時期を選択" />
								</SelectTrigger>
								<SelectContent>
									{periods.map((period) => (
										<SelectItem key={period} value={period}>
											{period}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button variant="outline" onClick={() => setIsAdding(false)}>
							キャンセル
						</Button>
						<Button
							onClick={handleAddInitiative}
							disabled={
								!newInitiative.title ||
								!newInitiative.body ||
								!newInitiative.targetPeriod
							}
						>
							<Save className="mr-2 h-4 w-4" />
							保存
						</Button>
					</CardFooter>
				</Card>
			)}
		</div>
	)
}
