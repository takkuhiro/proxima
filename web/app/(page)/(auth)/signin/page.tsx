"use client"

import { createSession } from "@/lib/actions/auth"
import { HOME_ROUTE } from "@/lib/constants"
import { signInWithEmailAndPassword } from "@/lib/firebase/auth"
import { getUserByUid, sendSession } from "@/lib/firebase/firestore"
import { sessionIdAtom, userAtom } from "@/lib/state"
import { useSetAtom } from "jotai"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

const SigninPage = () => {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const setUser = useSetAtom(userAtom)
	const router = useRouter()
	const setSessionId = useSetAtom(sessionIdAtom)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsLoading(true)
		try {
			const user = await signInWithEmailAndPassword(email, password)
			console.log(`User ${user.uid} signined`)
			const userInFirestore = await getUserByUid(user.uid)
			setUser(userInFirestore)
			const sessionId = await createSession(user.uid)
			setSessionId(sessionId)
			console.log(`sessionId: ${sessionId}`)
			sendSession(user.uid, sessionId)
			router.replace(HOME_ROUTE)
			toast.success("ログインに成功しました")
		} catch (e) {
			toast.error("ログインに失敗しました")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex h-screen items-center justify-center bg-[url('/head_signin.jpeg')] bg-cover bg-center">
			<div className="w-80 rounded-md bg-white/90 p-8 shadow-lg backdrop-blur-sm">
				<p className="mb-4 text-xl font-bold">ログイン</p>
				<form autoComplete="off" onSubmit={handleSubmit}>
					<label htmlFor="email" className="mb-1 block ">
						Email
					</label>
					<input
						id="email"
						type="email"
						className="mb-4 w-full rounded-md border border-[#E1E1E1] p-2 outline-none"
						required
						minLength={6}
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
					<label htmlFor="password" className="mb-1 block">
						Password
					</label>
					<input
						id="password"
						type="password"
						className="mb-8 w-full rounded-md border border-[#E1E1E1] p-2 outline-none"
						required
						minLength={6}
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
					<button
						type="submit"
						disabled={isLoading}
						className="mb-2 w-full rounded-md bg-primary px-4 py-2 font-bold text-white disabled:opacity-70"
					>
						{isLoading ? (
							<div className="flex items-center justify-center">
								<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
								<span className="ml-2">ログイン中...</span>
							</div>
						) : (
							"ログイン"
						)}
					</button>
				</form>
				<p className="text-center text-sm">
					アカウントを作成する場合は
					<Link href="/signup" className="font-bold text-blue-500">
						こちら
					</Link>
				</p>
			</div>
		</div>
	)
}

export default SigninPage
