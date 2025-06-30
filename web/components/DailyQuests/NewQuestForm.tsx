import type { categories } from "@/app/types"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"
import type React from "react"

type NewQuest = {
	title: string
	description: string
	category: string
	estimatedTime: string
}

interface NewQuestFormProps {
	newQuest: NewQuest
	setNewQuest: (q: NewQuest) => void
	categories: typeof categories
	estimatedTimes: string[]
	onCancel: () => void
	onSave: () => void
	saveDisabled?: boolean
	loading?: boolean
}

export const NewQuestForm: React.FC<NewQuestFormProps> = ({
	newQuest,
	setNewQuest,
	categories,
	estimatedTimes,
	onCancel,
	onSave,
	saveDisabled,
	loading,
}) => (
	<Card>
		<CardHeader>
			<CardTitle>新しいクエスト</CardTitle>
			<CardDescription>
				今日中に達成できる小さなタスクを設定しましょう
			</CardDescription>
		</CardHeader>
		<CardContent className="space-y-4">
			<div className="space-y-2">
				<label htmlFor="title" className="text-sm font-medium">
					タイトル
				</label>
				<Input
					id="title"
					value={newQuest.title}
					onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
					placeholder="クエストのタイトル"
				/>
			</div>
			<div className="space-y-2">
				<label htmlFor="description" className="text-sm font-medium">
					詳細
				</label>
				<Textarea
					id="description"
					value={newQuest.description}
					onChange={(e) =>
						setNewQuest({ ...newQuest, description: e.target.value })
					}
					placeholder="クエストの詳細な説明"
					rows={2}
				/>
			</div>
			<div className="space-y-2">
				<label htmlFor="category" className="text-sm font-medium">
					カテゴリ
				</label>
				<Select
					value={newQuest.category}
					onValueChange={(value) =>
						setNewQuest({ ...newQuest, category: value })
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="カテゴリを選択" />
					</SelectTrigger>
					<SelectContent>
						{categories.map((category) => (
							<SelectItem key={category} value={category}>
								{category}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<label htmlFor="estimated_time" className="text-sm font-medium">
					所要時間
				</label>
				<Select
					value={newQuest.estimatedTime}
					onValueChange={(value) =>
						setNewQuest({ ...newQuest, estimatedTime: value })
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="所要時間を選択" />
					</SelectTrigger>
					<SelectContent>
						{estimatedTimes.map((time) => (
							<SelectItem key={time} value={time}>
								{time}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</CardContent>
		<CardFooter className="flex justify-between">
			<Button variant="outline" onClick={onCancel} disabled={loading}>
				キャンセル
			</Button>
			<Button onClick={onSave} disabled={saveDisabled || loading}>
				<Save className="mr-2 h-4 w-4" />
				{loading ? "保存中..." : "保存"}
			</Button>
		</CardFooter>
	</Card>
)
