"use client"

import { TUTORIAL_ROUTE } from "@/lib/constants"
import { createUserWithEmailAndPassword } from "@/lib/firebase/auth"
import { addUser, getUserByUid } from "@/lib/firebase/firestore"
import { userAtom } from "@/lib/state"
import { useSetAtom } from "jotai"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

const SignupPage = () => {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const setUser = useSetAtom(userAtom)
	const router = useRouter()

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsLoading(true)
		try {
			const user = await createUserWithEmailAndPassword(email, password)
			await addUser(user.uid, user.email as string)
			const userInFirestore = await getUserByUid(user.uid)
			setUser(userInFirestore)
			router.replace(TUTORIAL_ROUTE)
			toast.success("アカウント登録が完了しました")
		} catch (e) {
			toast.error("アカウント登録に失敗しました")
			console.log(e)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex h-screen items-center justify-center bg-[url('/head_signup.jpeg')] bg-cover bg-center">
			<div className="w-80 rounded-md bg-white/90 p-8 shadow-lg backdrop-blur-sm">
				<p className="mb-4 text-xl font-bold">アカウント登録</p>
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
								<span className="ml-2">登録中...</span>
							</div>
						) : (
							"アカウント登録"
						)}
					</button>
				</form>
				<p className="text-center text-sm">
					アカウントをお持ちの方は
					<Link href="/signin" className="font-bold text-blue-500">
						こちら
					</Link>
				</p>
			</div>
		</div>
	)
}

export default SignupPage
