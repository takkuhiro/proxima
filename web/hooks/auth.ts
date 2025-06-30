import { onAuthStateChanged } from "@/lib/firebase/auth"
import { userIdAtom } from "@/lib/state"
import { useAtom } from "jotai"
import { useEffect } from "react"

export const useUserId = (): string | null => {
	const [userId, setUserId] = useAtom(userIdAtom)

	useEffect(() => {
		const unsubscribe = onAuthStateChanged((user) => {
			setUserId(user ? user.uid : null)
		})
		return () => unsubscribe()
	}, [setUserId])

	return userId
}
