'use client'

import { BottomTabBar } from "@/components/dotori/BottomTabBar"
import { useSyncExternalStore } from "react"

const subscribe = () => {
	return () => {}
}

const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function BottomTabBarClient() {
	const mounted = useSyncExternalStore(
		subscribe,
		getClientSnapshot,
		getServerSnapshot,
	)

	if (!mounted) {
		return null
	}

	return <BottomTabBar />
}
