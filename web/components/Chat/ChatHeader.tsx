import { Button } from "@/components/ui/button"
import { removeSession } from "@/lib/actions/auth"
import { signOut } from "@/lib/firebase/auth"
import { getUserSnapshot } from "@/lib/firebase/firestore"
import {
	articlesAtom,
	careerGoalsAtom,
	chatMessagesAtom,
	hasCareerGoalsFetchedAtom,
	hasInitiativesFetchedAtom,
	hasRoutineFetchedAtom,
	hasTaskFetchedAtom,
	initiativesAtom,
	questsAtom,
	routinesAtom,
	sessionIdAtom,
	userAtom,
	userIdAtom,
} from "@/lib/state"
import { useAtom, useSetAtom } from "jotai"
import { useEffect, useState } from "react"

export default function ChatHeader() {
	const [user, setUser] = useAtom(userAtom)
	const setUserId = useSetAtom(userIdAtom)
	const setSessionId = useSetAtom(sessionIdAtom)
	const setChatMessages = useSetAtom(chatMessagesAtom)
	const setQuests = useSetAtom(questsAtom)
	const setArticles = useSetAtom(articlesAtom)
	const setRoutines = useSetAtom(routinesAtom)
	const setHasTaskFetched = useSetAtom(hasTaskFetchedAtom)
	const setHasRoutineFetched = useSetAtom(hasRoutineFetchedAtom)
	const setCareerGoals = useSetAtom(careerGoalsAtom)
	const setHasCareerGoalsFetched = useSetAtom(hasCareerGoalsFetchedAtom)
	const setInitiatives = useSetAtom(initiativesAtom)
	const setHasInitiativesFetched = useSetAtom(hasInitiativesFetchedAtom)
	const [nickname, setNickname] = useState<string | null>(null)
	const email = user?.email

	useEffect(() => {
		if (!user?.id) return
		const unsubscribe = getUserSnapshot(user.id, (userData) => {
			setNickname(userData.nickname ?? null)
		})
		return () => unsubscribe()
	}, [user?.id])

	const handleSignOut = async () => {
		await signOut()
		setUser(null)
		setUserId(null)
		setSessionId(null)
		setChatMessages([])
		setQuests([])
		setArticles([])
		setRoutines([])
		setHasTaskFetched(false)
		setHasRoutineFetched(false)
		setCareerGoals([])
		setHasCareerGoalsFetched(false)
		setInitiatives([])
		setHasInitiativesFetched(false)
		await removeSession()
	}

	return (
		<div className="flex items-center justify-between p-4 md:p-6 border-b bg-background">
			<span className="text-sm text-muted-foreground">
				{nickname && email
					? `${nickname} さん (${email})`
					: email
						? email
						: "取得中..."}
			</span>
			<Button variant="outline" size="sm" onClick={handleSignOut}>
				サインアウト
			</Button>
		</div>
	)
}
