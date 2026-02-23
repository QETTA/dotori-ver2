"use client";

import {
	ChatBubbleLeftIcon as ChatOutline,
	UserGroupIcon as GroupOutline,
	HomeIcon as HomeOutline,
	MagnifyingGlassIcon as SearchOutline,
	UserCircleIcon as UserOutline,
} from "@heroicons/react/24/outline";
import {
	ChatBubbleLeftIcon as ChatSolid,
	UserGroupIcon as GroupSolid,
	HomeIcon as HomeSolid,
	MagnifyingGlassIcon as SearchSolid,
	UserCircleIcon as UserSolid,
} from "@heroicons/react/24/solid";
import { memo } from "react";
import { motion } from "motion/react";
import { tap } from "@/lib/motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DS_GLASS, DS_STATUS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand-assets";

const tabs = [
	{
		id: "home",
		label: "홈",
		href: "/",
		icon: HomeOutline,
		activeIcon: HomeSolid,
	},
	{
		id: "explore",
		label: "탐색",
		href: "/explore",
		icon: SearchOutline,
		activeIcon: SearchSolid,
	},
	{
		id: "chat",
		label: "토리챗",
		href: "/chat",
		icon: ChatOutline,
		activeIcon: ChatSolid,
	},
	{
		id: "community",
		label: "이웃",
		href: "/community",
		icon: GroupOutline,
		activeIcon: GroupSolid,
	},
	{
		id: "my",
		label: "MY",
		href: "/my",
		icon: UserOutline,
		activeIcon: UserSolid,
	},
] as const;

const navShellClass = cn(
	DS_GLASS.FLOAT,
	"fixed inset-x-3 bottom-2 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-md rounded-[1.3rem] border border-dotori-100/70 bg-dotori-50/90 px-1 pb-[max(0.55rem,env(safe-area-inset-bottom))] shadow-lg ring-1 ring-dotori-100/70",
	"backdrop-saturate-125",
);

export const BottomTabBar = memo(function BottomTabBar() {
	const pathname = usePathname() || "/";

	function isActive(href: string) {
		if (href === "/") return pathname === "/";
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	return (
		<nav
			className={navShellClass}
			role="navigation"
			aria-label="메인 내비게이션"
		>
			<img
				src={BRAND.symbol}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 opacity-[0.10]"
			/>
			<div className="relative flex items-center justify-around px-1.5 py-1.5">
				{tabs.map((tab) => {
					const active = isActive(tab.href);
					const Icon = active ? tab.activeIcon : tab.icon;
					const isChat = tab.id === "chat";

					return (
							<motion.div
								key={tab.id}
								className="flex-1 px-0.5"
								whileTap={tap.button.whileTap}
								transition={tap.button.transition}
							>
							<Link
								href={tab.href}
								aria-current={active ? "page" : undefined}
								aria-label={tab.label}
								className={cn(
									"relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[0.85rem] py-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-300/70 dark:focus-visible:ring-dotori-700/80",
								)}
							>
								<span
									className={cn(
										DS_GLASS.CARD,
										"pointer-events-none absolute inset-0.5 rounded-[0.8rem] ring-1 ring-dotori-200/70",
										isChat && "bg-dotori-50/85 dark:bg-dotori-900/65",
										active
											? "bg-gradient-to-b from-dotori-100/95 to-white/95 ring-dotori-300/70"
											: "opacity-0",
									)}
								/>
								<div
									className={cn(
									"relative z-10 grid h-7 w-7 place-items-center rounded-[0.72rem] transition-colors duration-200",
										isChat && "bg-dotori-100/70 dark:bg-dotori-900/65",
										active &&
											"bg-gradient-to-br from-dotori-100 via-dotori-50 to-forest-100 ring-1 ring-dotori-200/80 dark:from-dotori-800 dark:via-dotori-900 dark:to-dotori-900 dark:ring-dotori-700/70",
									)}
								>
									<Icon
										className={cn(
											"h-4 w-4 transition-colors duration-200",
											active
												? "text-dotori-600 dark:text-dotori-200"
												: "text-dotori-500/80 dark:text-dotori-400/80",
										)}
									/>
								</div>
								{isChat ? (
									<span
										aria-hidden="true"
										className={cn(
											"pointer-events-none absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full",
											DS_STATUS.available.dot,
										)}
									/>
								) : null}
								<span
									className={cn(
										DS_TYPOGRAPHY.label,
										"relative z-10 tracking-tight transition-colors duration-200",
										active
											? "font-semibold text-dotori-700 dark:text-dotori-100"
											: "font-medium text-dotori-500/80 dark:text-dotori-400/80",
									)}
								>
									{tab.label}
								</span>
								<span
									aria-hidden="true"
									className={cn(
										"pointer-events-none absolute bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full transition-all duration-300",
										active
											? "bg-dotori-500/70 dark:bg-dotori-300/80"
											: "bg-dotori-300/30 dark:bg-dotori-700/40",
									)}
								/>
							</Link>
						</motion.div>
					);
				})}
			</div>
		</nav>
	);
});
