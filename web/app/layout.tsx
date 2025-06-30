import { ThemeProvider } from "@/components/theme-provider"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"
import { ClientGuard } from "@/components/ClientGuard"
import { Provider as JotaiProvider } from "jotai"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
	title: "Proxima",
	description: "AI-powered application for engineer career growth",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased",
					inter.className,
				)}
			>
				<ClientGuard />
				<JotaiProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						{children}
						<Toaster />
						<Sonner />
					</ThemeProvider>
				</JotaiProvider>
			</body>
		</html>
	)
}
