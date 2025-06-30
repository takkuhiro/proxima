"use client"

import { cn } from "@/lib/utils"
import {
	CheckSquare,
	HelpCircle,
	MessageSquare,
	Newspaper,
	Target,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
	setOpen?: (open: boolean) => void
}

const items = [
	{
		title: "ホーム",
		href: "/",
		icon: MessageSquare,
	},
	{
		title: "プロファイル",
		href: "/growth",
		icon: Target,
	},
	{
		title: "クエスト",
		href: "/quests",
		icon: CheckSquare,
	},
	{
		title: "ニュース",
		href: "/informations",
		icon: Newspaper,
	},
	{
		title: "使い方",
		href: "/usage",
		icon: HelpCircle,
	},
]

export function Sidebar({ setOpen }: SidebarProps) {
	const pathname = usePathname()

	return (
		<div className="flex flex-col h-full py-6">
			<div className="px-4 mb-6 gap-2 h-16">{/* 空白 */}</div>
			<nav className="flex-1 px-2 space-y-1">
				{items.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						onClick={() => setOpen?.(false)}
						className={cn(
							"flex items-center px-3 py-3 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
							pathname === item.href
								? "bg-accent text-accent-foreground"
								: "text-foreground/60",
						)}
					>
						<item.icon className="mr-3 h-5 w-5" />
						{item.title}
					</Link>
				))}
			</nav>
		</div>
	)
}
