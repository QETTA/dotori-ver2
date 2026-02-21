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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const alertChannelSettings = [
	{
		key: "push" as const,
		label: "푸시 알림",
		desc: "빈자리, 대기순번 변동 알림을 앱 알림으로 받기",
		defaultOn: true,
	},
	{
		key: "kakao" as const,
		label: "카카오톡 알림",
		desc: "카카오톡으로 알림을 받기",
		defaultOn: false,
	},
	{
		key: "email" as const,
		label: "이메일 알림",
		desc: "주간 요약 이메일 알림을 받기",
		defaultOn: false,
	},
] as const;

type AlertChannelKey = (typeof alertChannelSettings)[number]["key"];

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

function isSupportedAlertChannel(channel: string): channel is AlertChannelKey {
	return alertChannelSettings.some((setting) => setting.key === channel);
}

export default function SettingsPage() {
	const [alerts, setAlerts] = useState<Record<AlertChannelKey, boolean>>(() =>
		alertChannelSettings.reduce<Record<AlertChannelKey, boolean>>(
			(acc, setting) => {
				acc[setting.key] = setting.defaultOn;
				return acc;
			},
			{ push: false, kakao: false, email: false },
		),
	);
	const [alimtalkOptIn, setAlimtalkOptIn] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const mountedRef = useRef(true);

	// 아이 관리 상태
	const [children, setChildren] = useState<ChildData[]>([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formName, setFormName] = useState("");
	const [formBirthDate, setFormBirthDate] = useState("");
	const [formGender, setFormGender] = useState<GenderOption>("unspecified");
	const [isSaving, setIsSaving] = useState(false);
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);

	const loadSettings = useCallback(async () => {
		setErrorMessage("");
		try {
			const [alertRes, userRes] = await Promise.all([
				apiFetch<{ data: AlertData[] }>("/api/alerts").catch(() => ({ data: [] as AlertData[] })),
				apiFetch<{ data: UserProfile }>("/api/users/me").catch(() => ({ data: {} as UserProfile })),
			]);

			if (!mountedRef.current) return;

			const loadedAlerts: Record<AlertChannelKey, boolean> = {
				push: false,
				kakao: false,
				email: false,
			};

			if (alertRes.data.length > 0) {
				const channels = new Set(alertRes.data.flatMap((a) => a.channels));
				for (const key of alertChannelSettings) {
					loadedAlerts[key.key] = channels.has(key.key);
				}
				setAlerts(loadedAlerts);
			}

			if (userRes.data?.alimtalkOptIn != null) {
				setAlimtalkOptIn(userRes.data.alimtalkOptIn);
			}

			if (userRes.data?.children) {
				setChildren(userRes.data.children);
			}
		} catch {
			// 사용 가능한 데이터가 없으면 기본값을 사용합니다.
		} finally {
			if (mountedRef.current) setIsLoaded(true);
		}
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		loadSettings();
		return () => {
			mountedRef.current = false;
		};
	}, [loadSettings]);

	async function toggleAlert(key: AlertChannelKey) {
		const newValue = !alerts[key];
		setAlerts((prev) => ({ ...prev, [key]: newValue }));

		try {
			const activeChannels = Object.entries({
				...alerts,
				[key]: newValue,
			})
				.filter(([, v]) => v)
				.map(([channel]) => channel)
				.filter(isSupportedAlertChannel);

			await apiFetch("/api/alerts/channels", {
				method: "PATCH",
				body: JSON.stringify({ channels: activeChannels }),
			});
		} catch {
			setErrorMessage("알림 설정 변경에 실패했습니다.");
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
			setErrorMessage("알림톡 설정 변경에 실패했습니다.");
			setAlimtalkOptIn(!newValue);
		}
	}

	async function handleLogout() {
		await signOut({ callbackUrl: "/login" });
	}

	async function handleDeleteAccount() {
		if (!window.confirm("계정을 영구 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.")) return;

		setIsDeletingAccount(true);
		setErrorMessage("");

		try {
			await apiFetch("/api/users/me", { method: "DELETE" });
			await signOut({ callbackUrl: "/login" });
		} catch {
			setErrorMessage(
				"아직 계정 삭제 API가 준비되지 않았습니다. 고객센터로 문의해 주세요.",
			);
		} finally {
			setIsDeletingAccount(false);
		}
	}

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
		const birthDateISO = `${formBirthDate}-01T00:00:00.000Z`;
		const updatedChildren = [...children];

		if (editingIndex !== null) {
			updatedChildren[editingIndex] = {
				...updatedChildren[editingIndex],
				name: formName.trim(),
				birthDate: birthDateISO,
				gender: formGender,
			};
		} else {
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
			setChildren(prev);
		}
	}

	const hasChildren = useMemo(() => children.length > 0, [children.length]);

	return (
		<div className="pb-28">
			{/* 헤더 */}
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

			{errorMessage && (
				<section className="mt-3 px-5">
					<div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
						{errorMessage}
					</div>
				</section>
			)}

			{/* 알림 설정 */}
			<section className="mt-4 px-5">
				<h2 className="mb-2 text-[15px] font-bold">알림 설정</h2>
				<div className="rounded-3xl bg-white shadow-sm">
					{alertChannelSettings.map((setting, i) => (
						<div
							key={setting.key}
							className={cn(
								"flex items-center justify-between gap-3 px-5 py-4.5",
								i < alertChannelSettings.length - 1 && "border-b border-dotori-100/40",
							)}
						>
							<div className="min-w-0">
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
					<div className="flex items-center justify-between gap-3 px-5 py-4.5">
						<div className="min-w-0">
							<p className="text-[15px] font-medium">카카오 알림톡 수신</p>
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

			{/* 계정 */}
			<section className="mt-6 px-5">
				<div className="mb-2.5 flex items-center justify-between">
					<h2 className="text-[15px] font-bold">계정</h2>
				</div>
				<div className="rounded-3xl bg-white shadow-sm">
					<div className="flex items-center justify-between px-5 py-4.5">
						<div className="min-w-0">
							<p className="text-[15px] font-medium">내 아이 관리</p>
							<p className="text-[13px] text-dotori-400">
								아이 정보를 추가하고 맞춤 추천을 관리하세요
							</p>
						</div>
						<button
							onClick={openAddDialog}
							className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-dotori-500 transition-colors hover:bg-dotori-50 active:scale-[0.97]"
						>
							<PlusIcon className="h-4 w-4" />
							아이 추가
						</button>
					</div>

					{hasChildren ? (
						<div className="rounded-b-3xl bg-white">
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
										<p className="text-[15px] font-semibold">{child.name}</p>
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
						<div className="rounded-b-3xl px-5 py-8 text-center">
							<p className="text-[15px] text-dotori-400">등록된 아이가 없어요</p>
							<p className="mt-1 text-[13px] text-dotori-300">
								아이를 등록하면 맞춤 전략을 받을 수 있어요
							</p>
						</div>
					)}
				</div>

				<div className="mt-3 flex flex-col gap-2">
					<button
						onClick={handleDeleteAccount}
						disabled={isDeletingAccount}
						className={cn(
							"rounded-2xl px-4 py-3 text-left text-[15px] font-semibold",
							"disabled:opacity-60",
							isDeletingAccount
								? "bg-red-50 text-red-400"
								: "bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98]",
						)}
					>
						{isDeletingAccount ? "계정 삭제 진행 중..." : "계정 삭제"}
					</button>
				</div>
			</section>

			{/* 앱 정보 */}
			<section className="mt-6 px-5">
				<h2 className="mb-2.5 text-[15px] font-bold">앱 정보</h2>
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

			{/* 아이 추가/수정 다이얼로그 */}
			<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} size="sm">
				<DialogTitle>
					{editingIndex !== null ? "아이 정보 수정" : "아이 추가"}
				</DialogTitle>
				<DialogBody>
					<div className="space-y-5">
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

			<div className="fixed inset-x-0 bottom-0 z-20 bg-white/95 px-5 pb-[env(safe-area-inset-bottom)] pt-3">
				<button
					onClick={handleLogout}
					className="w-full rounded-2xl border border-danger/30 bg-white px-4 py-3 text-left text-[15px] font-semibold text-danger transition-colors hover:bg-danger/5 active:scale-[0.98]"
				>
					카카오 로그아웃
				</button>
			</div>
		</div>
	);
}
