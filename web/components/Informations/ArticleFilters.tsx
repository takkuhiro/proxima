"use client"

import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

interface ArticleFiltersProps {
	category: string
	allCategories: string[]
	recommendLevel: string
	onCategoryChange: (value: string) => void
	onRecommendLevelChange: (value: string) => void
}

export function ArticleFilters({
	category,
	allCategories,
	recommendLevel,
	onCategoryChange,
	onRecommendLevelChange,
}: ArticleFiltersProps) {
	return (
		<div className="flex flex-col sm:flex-row gap-4">
			<div className="grid gap-2 w-full sm:max-w-[200px]">
				<Label htmlFor="category">カテゴリー</Label>
				<Select value={category} onValueChange={onCategoryChange}>
					<SelectTrigger id="category">
						<SelectValue placeholder="カテゴリーを選択" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">すべて</SelectItem>
						{allCategories.map((category) => (
							<SelectItem key={category} value={category}>
								{category}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="grid gap-2 w-full sm:max-w-[200px]">
				<Label htmlFor="recommend-level">おすすめレベル</Label>
				<Select value={recommendLevel} onValueChange={onRecommendLevelChange}>
					<SelectTrigger id="recommend-level">
						<SelectValue placeholder="おすすめレベルを選択" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">すべて</SelectItem>
						<SelectItem value="5">★★★★★ (5)</SelectItem>
						<SelectItem value="4">★★★★☆ (4+)</SelectItem>
						<SelectItem value="3">★★★☆☆ (3+)</SelectItem>
						<SelectItem value="2">★★☆☆☆ (2+)</SelectItem>
						<SelectItem value="1">★☆☆☆☆ (1+)</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}
