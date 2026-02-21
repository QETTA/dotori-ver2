"use client";

import { BRAND } from "@/lib/brand-assets";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/catalyst/button";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const facilityTypes = ["국공립", "민간", "가정", "직장"];
const features = [
	"통학버스",
	"연장보육",
	"급식자체조리",
	"영아전문",
	"장애아통합",
];
const sidoFallbackOptions = [
	"서울특별시",
	"부산광역시",
	"대구광역시",
	"인천광역시",
	"광주광역시",
	"대전광역시",
	"울산광역시",
	"세종특별자치시",
	"경기도",
	"강원특별자치도",
	"충청북도",
	"충청남도",
	"전라북도",
	"전라남도",
	"경상북도",
	"경상남도",
	"제주특별자치도",
];

export default function OnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState(0);
	const totalSteps = 3;
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const [childName, setChildName] = useState("");
	const [birthDate, setBirthDate] = useState("");
	const [birthYear, setBirthYear] = useState("");
	const [birthMonth, setBirthMonth] = useState("");
	const [gender, setGender] = useState("");

	// Sync year/month selects → birthDate (YYYY-MM format for API)
	function handleBirthYear(y: string) {
		setBirthYear(y);
		if (y && birthMonth) setBirthDate(`${y}-${birthMonth}`);
		else setBirthDate("");
	}
	function handleBirthMonth(m: string) {
		setBirthMonth(m);
		if (birthYear && m) setBirthDate(`${birthYear}-${m}`);
		else setBirthDate("");
	}

	const currentYear = new Date().getFullYear();
	const birthYearOptions = Array.from({ length: 8 }, (_, i) =>
		String(currentYear - i),
	);
	const [sido, setSido] = useState("");
	const [sigungu, setSigungu] = useState("");
	const [dong, setDong] = useState("");
	const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
	const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

	// Dynamic region data from API
	const [sidoList, setSidoList] = useState<string[]>([]);
	const [sigunguList, setSigunguList] = useState<string[]>([]);
	const [isLoadingSido, setIsLoadingSido] = useState(false);
	const [isLoadingSigungu, setIsLoadingSigungu] = useState(false);

	// Fetch sido list on mount
	useEffect(() => {
		setIsLoadingSido(true);
		apiFetch<{ data: string[] }>("/api/regions/sido")
			.then((res) => setSidoList(res.data))
			.catch(() => {
				// Fallback to common regions
				setSidoList(sidoFallbackOptions);
			})
			.finally(() => setIsLoadingSido(false));
	}, []);

	// Fetch sigungu list when sido changes
	const loadSigungu = useCallback(async (selectedSido: string) => {
		if (!selectedSido) {
			setSigunguList([]);
			return;
		}
		setIsLoadingSigungu(true);
		try {
			const res = await apiFetch<{ data: string[] }>(
				`/api/regions/sigungu?sido=${encodeURIComponent(selectedSido)}`,
			);
			setSigunguList(res.data);
		} catch {
			setSigunguList([]);
		} finally {
			setIsLoadingSigungu(false);
		}
	}, []);

	function handleSidoChange(newSido: string) {
		setSido(newSido);
		setSigungu("");
		setDong("");
		loadSigungu(newSido);
	}

	async function saveProfile() {
		setIsSaving(true);
		setSaveError(null);
		try {
			const genderMap: Record<string, string> = {
				여아: "female",
				남아: "male",
				선택안함: "unspecified",
			};

			const payload: Record<string, unknown> = {
				onboardingCompleted: true,
			};

			if (childName) {
				payload.children = [
					{
						name: childName,
						birthDate: birthDate || undefined,
						gender: genderMap[gender] || "unspecified",
					},
				];
			}

			if (sido) {
				payload.region = {
					sido,
					sigungu,
					dong: dong || undefined,
				};
			}

			if (selectedTypes.length > 0 || selectedFeatures.length > 0) {
				payload.preferences = {
					facilityTypes: selectedTypes,
					features: selectedFeatures,
				};
			}

			await apiFetch("/api/users/me", {
				method: "PATCH",
				body: JSON.stringify(payload),
			});

			router.push("/");
		} catch {
			setSaveError("저장에 실패했어요. 다시 시도하거나 건너뛰기를 눌러주세요.");
		} finally {
			setIsSaving(false);
		}
	}

	function next() {
		if (step < totalSteps - 1) {
			setStep((s) => s + 1);
		} else {
			saveProfile();
		}
	}

	function back() {
		if (step > 0) setStep((s) => s - 1);
	}

	function toggle(
		list: string[],
		set: (v: string[]) => void,
		item: string,
	) {
		set(
			list.includes(item)
				? list.filter((i) => i !== item)
				: [...list, item],
		);
	}

	const inputCls =
		"w-full rounded-3xl border-none bg-dotori-100/60 px-5 py-4 text-[15px] outline-none transition-all focus:ring-2 focus:ring-dotori-300";

	return (
		<div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-dotori-50 px-6">
			{/* ── 워터마크 장식 ── */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 select-none opacity-[0.04]"
			/>
			{/* ── 헤더 ── */}
			<header className="flex items-center justify-between pb-2 pt-[env(safe-area-inset-top)]">
				<div className="pt-4">
					{step > 0 ? (
						<button
							onClick={back}
							aria-label="뒤로 가기"
							className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
						>
							<ArrowLeftIcon className="h-6 w-6" />
						</button>
					) : (
						<div className="h-8 w-8" />
					)}
				</div>
				<button
					onClick={() => router.push("/")}
					className="pt-4 py-2 text-[15px] text-dotori-400 transition-colors hover:text-dotori-500"
				>
					건너뛰기
				</button>
			</header>

			{/* ── 단계 인디케이터 ── */}
			<div className="mt-2 flex justify-center gap-2">
				{Array.from({ length: totalSteps }).map((_, i) => (
					<div
						key={i}
						className={cn(
							"h-2.5 w-2.5 rounded-full transition-all duration-300",
							i <= step ? "bg-dotori-500" : "bg-dotori-200",
						)}
					/>
				))}
			</div>

			{/* ── 컨텐츠 ── */}
			<div className="mt-8 flex-1">
				{step === 0 && (
					<div
						key="step0"
						className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3 duration-300"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt=""
							className="h-10 w-10"
						/>
						<div>
							<h1 className="text-xl font-bold">
								아이 정보를 알려주세요
							</h1>
							<p className="mt-1 text-[14px] text-dotori-400">
								맞춤 입소 전략을 위해 필요해요
							</p>
						</div>

						<div>
							<label className="mb-2 block text-[14px] font-medium text-dotori-500">
								아이 이름
							</label>
							<input
								type="text"
								value={childName}
								onChange={(e) => setChildName(e.target.value)}
								placeholder="이름을 입력하세요"
								className={inputCls}
							/>
						</div>
						<div>
							<label className="mb-2 block text-[14px] font-medium text-dotori-500">
								생년월
							</label>
							<div className="flex gap-2">
								<select
									value={birthYear}
									onChange={(e) => handleBirthYear(e.target.value)}
									className={cn(inputCls, "flex-1", !birthYear && "text-dotori-400")}
								>
									<option value="">년도</option>
									{birthYearOptions.map((y) => (
										<option key={y} value={y}>
											{y}년
										</option>
									))}
								</select>
								<select
									value={birthMonth}
									onChange={(e) => handleBirthMonth(e.target.value)}
									className={cn(inputCls, "flex-1", !birthMonth && "text-dotori-400")}
								>
									<option value="">월</option>
									{Array.from({ length: 12 }, (_, i) => {
										const m = String(i + 1).padStart(2, "0");
										return (
											<option key={m} value={m}>
												{i + 1}월
											</option>
										);
									})}
								</select>
							</div>
						</div>
						<div>
							<label className="mb-2 block text-[14px] font-medium text-dotori-500">
								성별
							</label>
							<div className="flex gap-2" role="radiogroup" aria-label="성별 선택">
								{["여아", "남아", "선택안함"].map((g) => (
									<button
										key={g}
										role="radio"
										aria-checked={gender === g}
										aria-label={`성별 ${g}`}
										onClick={() => setGender(g)}
										className={cn(
											"flex-1 rounded-3xl py-3.5 text-[15px] font-medium transition-all active:scale-[0.97]",
											gender === g
												? "bg-dotori-900 text-white"
												: "bg-white text-dotori-600 shadow-sm",
										)}
									>
										{g}
									</button>
								))}
							</div>
						</div>
					</div>
				)}

				{step === 1 && (
					<div
						key="step1"
						className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3 duration-300"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt=""
							className="h-10 w-10"
						/>
						<div>
							<h1 className="text-xl font-bold">
								거주 지역을 알려주세요
							</h1>
							<p className="mt-1 text-[14px] text-dotori-400">
								주변 시설을 찾기 위해 필요해요
							</p>
						</div>

						<div>
							<label className="mb-2 block text-[14px] font-medium text-dotori-500">
								시/도
							</label>
							<select
							value={sido}
							onChange={(e) => handleSidoChange(e.target.value)}
							disabled={isLoadingSido}
							className={cn(inputCls, isLoadingSido && "opacity-60")}
						>
							<option value="">
								{isLoadingSido ? "불러오는 중..." : "선택하세요"}
							</option>
							{sidoList.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="mb-2 block text-[14px] font-medium text-dotori-500">
							시/군/구
						</label>
						<select
							value={sigungu}
							onChange={(e) => setSigungu(e.target.value)}
							disabled={!sido || isLoadingSigungu}
							className={cn(inputCls, (!sido || isLoadingSigungu) && "opacity-60")}
						>
							<option value="">
								{isLoadingSigungu
									? "불러오는 중..."
									: !sido
										? "시/도를 먼저 선택하세요"
										: "선택하세요"}
							</option>
							{sigunguList.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
						</div>
						<div>
							<label className="mb-2 block text-[14px] font-medium text-dotori-500">
								동/읍/면 (선택)
							</label>
							<input
								type="text"
								value={dong}
								onChange={(e) => setDong(e.target.value)}
								placeholder="역삼동"
								className={inputCls}
							/>
						</div>
					</div>
				)}

				{step === 2 && (
					<div
						key="step2"
						className="space-y-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3 duration-300"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt=""
							className="h-10 w-10"
						/>
						<div>
							<h1 className="text-xl font-bold">
								관심 유형을 선택하세요
							</h1>
							<p className="mt-1 text-[14px] text-dotori-400">
								여러 개 선택할 수 있어요
							</p>
						</div>

						<div>
							<label className="mb-2 block text-[14px] font-medium text-dotori-500">
								시설 유형
							</label>
							<div className="flex flex-wrap gap-2">
								{facilityTypes.map((type) => (
									<button
										key={type}
										onClick={() =>
											toggle(
												selectedTypes,
												setSelectedTypes,
												type,
											)
										}
										className={cn(
											"rounded-full px-5 py-3 text-[15px] font-medium transition-all active:scale-[0.97]",
											selectedTypes.includes(type)
												? "bg-dotori-900 text-white"
												: "bg-white text-dotori-600 shadow-sm",
										)}
									>
										{type}
									</button>
								))}
							</div>
						</div>
						<div>
							<label className="mb-2 block text-[14px] font-medium text-dotori-500">
								관심 특징
							</label>
							<div className="flex flex-wrap gap-2">
								{features.map((feat) => (
									<button
										key={feat}
										onClick={() =>
											toggle(
												selectedFeatures,
												setSelectedFeatures,
												feat,
											)
										}
										className={cn(
											"rounded-full px-5 py-3 text-[15px] font-medium transition-all active:scale-[0.97]",
											selectedFeatures.includes(feat)
												? "bg-dotori-900 text-white"
												: "bg-white text-dotori-600 shadow-sm",
										)}
									>
										{feat}
									</button>
								))}
							</div>
						</div>
					</div>
				)}
			</div>

			{/* ── 하단 CTA ── */}
			<div className="pb-8 pt-6">
				{saveError && (
					<div className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-red-600">
						{saveError}
					</div>
				)}
				<Button
					color="dotori"
					onClick={next}
					disabled={isSaving}
					className={cn(
						"w-full py-4.5 text-[16px] font-semibold transition-all active:scale-[0.98]",
						isSaving && "opacity-60",
					)}
				>
					{isSaving
						? "저장 중..."
						: step === totalSteps - 1
							? "시작하기"
							: "다음"}
				</Button>
			</div>
		</div>
	);
}
