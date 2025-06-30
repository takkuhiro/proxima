"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserId } from "@/hooks/auth"
import { adviceAtom, hasAdviceFetchedAtom } from "@/lib/state"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { useAtom } from "jotai"
import { useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function AdviceContent() {
	const [advice, setAdvice] = useAtom(adviceAtom)
	const [hasAdviceFetched, setHasAdviceFetched] = useAtom(hasAdviceFetchedAtom)
	const userId = useUserId()

	useEffect(() => {
		const fetchAdvice = async () => {
			if (hasAdviceFetched) return

			try {
				const result = await fetch(`/api/advice?userId=${userId}`)
				const data = await result.json()
				setAdvice(data)
			} catch (error) {
				console.error("Failed to fetch advice:", error)
			} finally {
				setHasAdviceFetched(true)
			}
		}

		fetchAdvice()
	}, [userId, hasAdviceFetched, setAdvice, setHasAdviceFetched])

	if (!hasAdviceFetched) {
		return (
			<div className="flex items-start gap-4">
				<Avatar className="h-12 w-12">
					<AvatarImage src="/icons/Reika.png" alt="@proxima" />
					<AvatarFallback>P</AvatarFallback>
				</Avatar>
				<div className="flex-1 rounded-lg bg-muted p-4">
					<div className="prose prose-sm max-w-none text-muted-foreground">
						Loading...
					</div>
				</div>
			</div>
		)
	}

	if (!advice) {
		return (
			<div className="flex items-start gap-4">
				<Avatar className="h-12 w-12">
					<AvatarImage src="/icons/Reika.png" alt="@proxima" />
					<AvatarFallback>P</AvatarFallback>
				</Avatar>
				<div className="flex-1 rounded-lg bg-muted p-4">
					<div className="prose prose-sm max-w-none text-muted-foreground">
						アドバイスはまだありません。
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex items-start gap-4">
			<Avatar className="h-12 w-12">
				<AvatarImage src="/icons/Reika.png" alt="@proxima" />
				<AvatarFallback>P</AvatarFallback>
			</Avatar>
			<div className="flex-1 rounded-lg bg-muted p-4">
				<div className="flex flex-col gap-2">
					<div className="text-xs text-muted-foreground">
						{format(new Date(advice.createdAt), "yyyy年MM月dd日 HH:mm", {
							locale: ja,
						})}
					</div>
					<div className="prose prose-sm max-w-none text-muted-foreground">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{advice.markdown}
						</ReactMarkdown>
					</div>
				</div>
			</div>
		</div>
	)
}
