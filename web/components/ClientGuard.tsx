"use client"
import { TUTORIAL_ROUTE } from "@/lib/constants"
import { userAtom } from "@/lib/state"
import { useAtom } from "jotai"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

export const ClientGuard = () => {
	const [user] = useAtom(userAtom)
	const router = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		if (user?.status === undefined) {
			return
		}
		if (user?.status === "waitingForTutorial" && pathname !== TUTORIAL_ROUTE) {
			console.log(`ClientGuard: ${user?.status}`)
			router.replace(TUTORIAL_ROUTE)
		}
	}, [user, pathname, router])

	return null
}
