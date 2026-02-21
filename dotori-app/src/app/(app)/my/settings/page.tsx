"use client";

import { Button } from "@/components/catalyst/button";
import {
	Dialog,
	DialogActions,
	DialogBody,
	DialogTitle,
} from "@/components/catalyst/dialog";
import { Input } from "@/components/catalyst/input";
import { Switch, SwitchField } from "@/components/catalyst/switch";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
	ArrowLeftIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const alertSettings = [
	{
		key: "push",
		label: "푸시 알림",
		desc: "빈자리, 대기 순번 변동 알림",
		defaultOn: true,
	},
	{
		key: "kakao",
		label: "카카오톡 알림",
		desc: "카카오톡으로 알림 수신",
		defaultOn: false,
	},
	{
		key: "email",
		label: "이메일 알림",
		desc: "주간 리포트 이메일 수신",
		defaultOn: false,
	},
];

interface AlertData {
	_id: string;
	channels: string[];
	active: boolean;
}

interface ChildData {
	id: string;
	name: string;
	birthDate: string;
	gender: "male" | "female" | "unspecified";
}

interface UserProfile {
	alimtalkOptIn?: boolean;
	phone?: string;
	children?: ChildData[];
}

type GenderOption = "female" | "male" | "unspecified";

const genderLabels: Record<GenderOption, string> = {
	female: "여아",
	male: "남아",
	unspecified: "선택안함",
};

function generateId() {
	return `child_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function calculateAge(birthDate: string) {
	const birth = new Date(birthDate);
	const now = new Date();
	const months =
		(now.getFullYear() - birth.getFullYear()) * 12 +
		(now.getMonth() - birth.getMonth());
	if (months < 12) return `${months}개월`;
	const years = Math.floor(months / 12);
	const rem = months % 12;
	return rem > 0 ? `${years}세 ${rem}개월` : `${years}세`;
}

function formatBirthMonth(birthDate: string) {
	const d = new Date(birthDate);
	return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

export default function SettingsPage() {
	const [alerts, setAlerts] = useState<Record<string, boolean>>(() =>
		Object.fromEntries(alertSettings.map((s) => [s.key, s.defaultOn])),
	);
	const [alimtalkOptIn, setAlimtalkOptIn] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const mountedRef = useRef(true);

	// ── 아이 관리 상태 ──
	const [children, setChildren] = useState<ChildData[]>([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formName, setFormName] = useState("");
	const [formBirthDate, setFormBirthDate] = useState("");
	const [formGender, setFormGender] = useState<GenderOption>("unspecified");
	const [isSaving, setIsSaving] = useState(false);

	const loadAlertSettings = useCallback(async () => {
		try {
			const [alertRes, userRes] = await Promise.all([
				apiFetch<{ data: AlertData[] }>("/api/alerts").catch(() => ({ data: [] as AlertData[] })),
				apiFetch<{ data: UserProfile }>("/api/users/me").catch(() => ({ data: {} as UserProfile })),
			]);
			if (!mountedRef.current) return;

			if (alertRes.data.length > 0) {
				const channels = new Set(
					alertRes.data.flatMap((a) => a.channels),
				);
				setAlerts({
					push: channels.has("push"),
					kakao: channels.has("kakao"),
					email: channels.has("email"),
				});
			}

			if (userRes.data?.alimtalkOptIn != null) {
				setAlimtalkOptIn(userRes.data.alimtalkOptIn);
			}

			if (userRes.data?.children) {
				setChildren(userRes.data.children);
			}
		} catch {
			// Use defaults if not logged in
		} finally {
			if (mountedRef.current) setIsLoaded(true);
		}
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		loadAlertSettings();
		return () => { mountedRef.current = false; };
	}, [loadAlertSettings]);

	async function toggleAlert(key: string) {
		const newValue = !alerts[key];
		setAlerts((prev) => ({ ...prev, [key]: newValue }));

		// Persist to server — update channels on all active alerts
		try {
			const activeChannels = Object.entries({
				...alerts,
				[key]: newValue,
			})
				.filter(([, v]) => v)
				.map(([k]) => k);

			await apiFetch("/api/alerts/channels", {
				method: "PATCH",
				body: JSON.stringify({ channels: activeChannels }),
			});
		} catch {
			// Revert on error
			setAlerts((prev) => ({ ...prev, [key]: !newValue }));
		}
	}

	async function toggleAlimtalk() {
		const newValue = !alimtalkOptIn;
		setAlimtalkOptIn(newValue);
		try {
			await apiFetch("/api/users/me", {
				method: "PATCH",
				body: JSON.stringify({ alimtalkOptIn: newValue }),
			});
		} catch {
			setAlimtalkOptIn(!newValue); // revert
		}
	}

	async function handleLogout() {
		await signOut({ callbackUrl: "/login" });
	}

	// ── 아이 관리 함수 ──
	function openAddDialog() {
		setEditingIndex(null);
		setFormName("");
		setFormBirthDate("");
		setFormGender("unspecified");
		setDialogOpen(true);
	}

	function openEditDialog(index: number) {
		const child = children[index];
		setEditingIndex(index);
		setFormName(child.name);
		// Convert birthDate (ISO string) to YYYY-MM for month input
		const d = new Date(child.birthDate);
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, "0");
		setFormBirthDate(`${yyyy}-${mm}`);
		setFormGender(child.gender);
		setDialogOpen(true);
	}

	async function handleSaveChild() {
		if (!formName.trim() || !formBirthDate) return;

		setIsSaving(true);

		// Convert YYYY-MM to ISO date string (first day of month)
		const birthDateISO = `${formBirthDate}-01T00:00:00.000Z`;

		const updatedChildren = [...children];

		if (editingIndex !== null) {
			// Edit existing
			updatedChildren[editingIndex] = {
				...updatedChildren[editingIndex],
				name: formName.trim(),
				birthDate: birthDateISO,
				gender: formGender,
			};
		} else {
			// Add new
			updatedChildren.push({
				id: generateId(),
				name: formName.trim(),
				birthDate: birthDateISO,
				gender: formGender,
			});
		}

		try {
			await apiFetch("/api/users/me", {
				method: "PATCH",
				body: JSON.stringify({ children: updatedChildren }),
			});
			setChildren(updatedChildren);
			setDialogOpen(false);
		} catch {
			// Keep dialog open on error
		} finally {
			setIsSaving(false);
		}
	}

	async function handleDeleteChild(index: number) {
		const updatedChildren = children.filter((_, i) => i !== index);

		const prev = [...children];
		setChildren(updatedChildren);

		try {
			await apiFetch("/api/users/me", {
				method: "PATCH",
				body: JSON.stringify({ children: updatedChildren }),
			});
		} catch {
			setChildren(prev); // revert
		}
	}

	return (
		<div className="pb-8">
			{/* ── 헤더 ── */}
			<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-3.5 backdrop-blur-xl">
				<Link
					href="/my"
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</Link>
				<h1 className="text-[17px] font-bold">설정</h1>
			</header>

			{/* ── 알림 설정 ── */}
			<section className="mt-2 px-5">
				<h2 className="mb-3 text-[14px] font-medium text-dotori-400">
					알림
				</h2>
				<div className="rounded-3xl bg-white shadow-sm">
					{alertSettings.map((setting, i) => (
						<div
							key={setting.key}
							className={cn(
								"flex items-center justify-between px-5 py-4.5",
								i < alertSettings.length - 1 &&
									"border-b border-dotori-100/40",
							)}
						>
							<div>
								<p className="text-[15px] font-medium">{setting.label}</p>
								<p className="text-[13px] text-dotori-400">{setting.desc}</p>
							</div>
							<SwitchField>
								<Switch
									checked={alerts[setting.key]}
									onChange={() => toggleAlert(setting.key)}
									color="dotori"
									disabled={!isLoaded}
								/>
							</SwitchField>
						</div>
					))}
				</div>
			</section>

			{/* ── 카카오 알림톡 ── */}
			<section className="mt-6 px-5">
				<h2 className="mb-3 text-[14px] font-medium text-dotori-400">
					카카오 알림톡
				</h2>
				<div className="rounded-3xl bg-white shadow-sm">
					<div className="flex items-center justify-between px-5 py-4.5">
						<div>
							<p className="text-[15px] font-medium">알림톡 수신</p>
							<p className="text-[13px] text-dotori-400">
								빈자리 알림을 카카오 알림톡으로 받기
							</p>
						</div>
						<SwitchField>
							<Switch
								checked={alimtalkOptIn}
								onChange={toggleAlimtalk}
								color="dotori"
								disabled={!isLoaded}
							/>
						</SwitchField>
					</div>
				</div>
			</section>

			{/* ── 내 아이 관리 ── */}
			<section className="mt-6 px-5">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-[14px] font-medium text-dotori-400">
						내 아이 관리
					</h2>
					<button
						onClick={openAddDialog}
						className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-dotori-500 transition-colors hover:bg-dotori-50 active:scale-[0.97]"
					>
						<PlusIcon className="h-4 w-4" />
						아이 추가
					</button>
				</div>

				{children.length > 0 ? (
					<div className="rounded-3xl bg-white shadow-sm">
						{children.map((child, i) => (
							<div
								key={child.id}
								className={cn(
									"flex items-center gap-3.5 px-5 py-4.5",
									i < children.length - 1 &&
										"border-b border-dotori-100/40",
								)}
							>
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-dotori-50 text-[13px] font-bold text-dotori-500">
									{child.gender === "female"
										? "👧"
										: child.gender === "male"
											? "👦"
											: "👶"}
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[15px] font-semibold">
										{child.name}
									</p>
									<p className="text-[13px] text-dotori-400">
										{formatBirthMonth(child.birthDate)}
										{" · "}
										{calculateAge(child.birthDate)}
									</p>
								</div>
								<div className="flex items-center gap-1">
									<button
										onClick={() => openEditDialog(i)}
										className="rounded-full p-2 text-dotori-400 transition-colors hover:bg-dotori-50 hover:text-dotori-600 active:scale-[0.97]"
										aria-label={`${child.name} 수정`}
									>
										<PencilIcon className="h-4.5 w-4.5" />
									</button>
									<button
										onClick={() => handleDeleteChild(i)}
										className="rounded-full p-2 text-dotori-400 transition-colors hover:bg-red-50 hover:text-red-500 active:scale-[0.97]"
										aria-label={`${child.name} 삭제`}
									>
										<TrashIcon className="h-4.5 w-4.5" />
									</button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="rounded-3xl bg-white shadow-sm">
						<div className="px-5 py-8 text-center">
							<p className="text-[15px] text-dotori-400">
								등록된 아이가 없어요
							</p>
							<p className="mt-1 text-[13px] text-dotori-300">
								아이를 등록하면 맞춤 전략을 받을 수 있어요
							</p>
						</div>
					</div>
				)}
			</section>

			{/* ── 아이 추가/수정 다이얼로그 ── */}
			<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} size="sm">
				<DialogTitle>
					{editingIndex !== null ? "아이 정보 수정" : "아이 추가"}
				</DialogTitle>
				<DialogBody>
					<div className="space-y-5">
						{/* 이름 */}
						<div>
							<label className="mb-1.5 block text-[14px] font-medium text-dotori-900">
								이름
							</label>
							<Input
								type="text"
								placeholder="아이 이름"
								value={formName}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setFormName(e.target.value)
								}
							/>
						</div>

						{/* 생년월 */}
						<div>
							<label className="mb-1.5 block text-[14px] font-medium text-dotori-900">
								생년월
							</label>
							<Input
								type="month"
								value={formBirthDate}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setFormBirthDate(e.target.value)
								}
							/>
						</div>

						{/* 성별 */}
						<div>
							<label className="mb-2 block text-[14px] font-medium text-dotori-900">
								성별
							</label>
							<div className="flex gap-2">
								{(
									["female", "male", "unspecified"] as GenderOption[]
								).map((g) => (
									<button
										key={g}
										type="button"
										onClick={() => setFormGender(g)}
										className={cn(
											"flex-1 rounded-xl border py-2.5 text-[14px] font-medium transition-all active:scale-[0.97]",
											formGender === g
												? "border-dotori-400 bg-dotori-50 text-dotori-600"
												: "border-dotori-100 bg-white text-dotori-400 hover:border-dotori-200",
										)}
									>
										{genderLabels[g]}
									</button>
								))}
							</div>
						</div>
					</div>
				</DialogBody>
				<DialogActions>
					<Button
						type="button"
						plain={true}
						onClick={() => setDialogOpen(false)}
					>
						취소
					</Button>
					<Button
						type="button"
						color="dotori"
						onClick={handleSaveChild}
						disabled={!formName.trim() || !formBirthDate || isSaving}
					>
						{isSaving
							? "저장 중..."
							: editingIndex !== null
								? "수정"
								: "추가"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* ── 앱 정보 ── */}
			<section className="mt-6 px-5">
				<h2 className="mb-3 text-[14px] font-medium text-dotori-400">
					정보
				</h2>
				<div className="rounded-3xl bg-white shadow-sm">
					<div className="flex items-center justify-between px-5 py-4 border-b border-dotori-100/40">
						<span className="text-[15px]">버전</span>
						<span className="text-[15px] text-dotori-400">1.0.0</span>
					</div>
					<div className="flex items-center justify-between px-5 py-4">
						<span className="text-[15px]">빌드</span>
						<span className="text-[15px] text-dotori-400">2026.02.20</span>
					</div>
				</div>
			</section>

			{/* ── 로그아웃 ── */}
			<div className="mt-6 px-4 text-center">
				<button
					onClick={handleLogout}
					className="py-2 text-[14px] text-dotori-400 transition-colors hover:text-dotori-500"
				>
					로그아웃
				</button>
			</div>
		</div>
	);
}
