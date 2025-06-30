"use client"

import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import type React from "react"
import { useState } from "react"

interface MainLayoutProps {
	children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
	const [open, setOpen] = useState(false)

	return (
		<div className="flex min-h-screen">
			{/* Desktop Sidebar */}
			<div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r">
				<Sidebar />
			</div>

			{/* Mobile Sidebar */}
			<div className="md:hidden">
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-4 left-4 z-40"
						>
							<Menu className="h-5 w-5" />
							<span className="sr-only">Toggle menu</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="p-0 w-64">
						<Sidebar setOpen={setOpen} />
					</SheetContent>
				</Sheet>
			</div>

			{/* Main Content */}
			<div className="flex flex-col flex-1 md:pl-64">
				<main className="flex-1">{children}</main>
			</div>
		</div>
	)
}
