"use client"

import { ArticleCard } from "@/components/Informations/ArticleCard"
import { ArticleFilters } from "@/components/Informations/ArticleFilters"
import { useUserId } from "@/hooks/auth"
import { fetchArticles } from "@/hooks/information"
import { articlesAtom } from "@/lib/state"
import { useAtom } from "jotai"
import { useEffect } from "react"
import { useState } from "react"
import { PulseLoader } from "react-spinners"

export default function InformationsClient() {
	const [articles, setArticles] = useAtom(articlesAtom)
	const userId = useUserId()
	const [isLoading, setIsLoading] = useState(false)
	const [category, setCategory] = useState<string>("all")
	const [recommendLevel, setRecommendLevel] = useState<string>("all")

	useEffect(() => {
		if (userId) {
			setIsLoading(true)
			fetchArticles(userId)
				.then((data) => {
					setArticles(data)
				})
				.finally(() => setIsLoading(false))
		}
	}, [userId, setArticles])

	// フィルタリング処理
	const filteredArticles = articles.filter((article) => {
		const categoryMatch = category === "all" || article.category === category
		const recommendMatch =
			recommendLevel === "all" ||
			article.recommendLevel >= Number(recommendLevel)
		return categoryMatch && recommendMatch
	})

	// category一覧
	const allCategories = Array.from(
		new Set(articles.map((article) => article.category)),
	)

	const handleFavoriteChange = (id: string, newFavorite: boolean) => {
		setArticles((prev) =>
			prev.map((a) => (a.id === id ? { ...a, favorite: newFavorite } : a)),
		)
	}

	return (
		<>
			{isLoading && (
				<div className="flex flex-col justify-center items-center py-8">
					<PulseLoader color="#888" size={12} />
					<p className="text-muted-foreground mt-4">読み込み中...</p>
				</div>
			)}
			{!isLoading && (
				<>
					<ArticleFilters
						category={category}
						allCategories={allCategories}
						recommendLevel={recommendLevel}
						onCategoryChange={setCategory}
						onRecommendLevelChange={setRecommendLevel}
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
						{filteredArticles.map((article) => (
							<ArticleCard
								key={article.id}
								article={article}
								userId={userId ?? ""}
								onFavoriteChange={handleFavoriteChange}
							/>
						))}
					</div>
				</>
			)}
		</>
	)
}
