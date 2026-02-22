"use client";

import { BRAND } from "@/lib/brand-assets";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/catalyst/button";
import { Badge } from "@/components/catalyst/badge";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
const popularSidoOptions = ["서울특별시", "경기도", "인천광역시"];
const stepGuides = [
	{
		label: "아이 기본정보",
		eta: "약 40초",
		hint: "아이 연령/상황 기반으로 맞춤 입소 전략 정확도를 높여요",
	},
	{
		label: "거주 지역",
		eta: "약 30초",
		hint: "내 동네 기준으로 실제 이동 가능한 시설을 빠르게 찾게 돼요",
	},
	{
		label: "선호 조건",
		eta: "약 30초",
		hint: "시설 유형과 특징을 반영해 추천 결과를 압축해드려요",
	},
	{
		label: "알림 설정",
		eta: "약 20초",
		hint: "빈자리 발생 시 우선순위 시설을 즉시 확인할 수 있어요",
	},
	{
		label: "AI 전략",
		eta: "약 20초",
		hint: "토리챗이 반편성·교사·입소 시나리오를 한 번에 정리해줘요",
	},
] as const;

export default function OnboardingPage() {
	const router = useRouter();
	const totalSteps = 6;
	const finalQuestionStep = totalSteps - 2;
	const [step, setStep] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const [childName, setChildName] = useState("");
	const [birthDate, setBirthDate] = useState("");
	const currentYear = new Date().getFullYear();
	const [birthYear, setBirthYear] = useState(String(currentYear - 2));
	const [birthMonth, setBirthMonth] = useState("");
	const [gender, setGender] = useState("");

	const [sido, setSido] = useState("");
	const [sigungu, setSigungu] = useState("");
	const [dong, setDong] = useState("");
	const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
	const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

	// Dynamic region data from API
	const [sidoList, setSidoList] = useState<string[]>(sidoFallbackOptions);
	const [sigunguList, setSigunguList] = useState<string[]>([]);
	const [isLoadingSido, setIsLoadingSido] = useState(false);
	const [isLoadingSigungu, setIsLoadingSigungu] = useState(false);

	const birthYearOptionsRange = useMemo(() => {
		const minYear = currentYear - 12;
		return {
			minYear,
			maxYear: currentYear,
		};
	}, [currentYear]);

	const childAge = useMemo(() => {
		if (!birthYear || !birthMonth) return null;
		const y = Number(birthYear);
		const m = Number(birthMonth);
		if (!y || !m) return null;
		const today = new Date();
		const birthYearMonth = new Date(today.getFullYear(), m - 1, 1);
		let age = today.getFullYear() - y;
		if (
			today.getMonth() < birthYearMonth.getMonth() ||
			(today.getMonth() === birthYearMonth.getMonth() &&
				today.getDate() < birthYearMonth.getDate())
		) {
			age -= 1;
		}
		return Math.max(age, 0);
	}, [birthMonth, birthYear]);

	const orderedSidoList = useMemo(() => {
		const pinned = popularSidoOptions.filter((s) => sidoList.includes(s));
		const rest = sidoList.filter((s) => !pinned.includes(s));
		return [...pinned, ...rest];
	}, [sidoList]);

	const progressPercent = (Math.min(step + 1, totalSteps) / totalSteps) * 100;
	const activeGuide = stepGuides[Math.min(step, stepGuides.length - 1)];

	useEffect(() => {
		if (birthYear && birthMonth) {
			setBirthDate(`${birthYear}-${birthMonth}`);
		} else {
			setBirthDate("");
		}
	}, [birthMonth, birthYear]);

	// Fetch sido list on mount
	useEffect(() => {
		setIsLoadingSido(true);
		apiFetch<{ data: string[] }>("/api/regions/sido")
			.then((res) => {
				const merged = Array.from(
					new Set([...res.data, ...sidoFallbackOptions]),
				);
				setSidoList(merged);
			})
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

			setStep(finalQuestionStep + 1);
		} catch {
			setSaveError("저장에 실패했어요. 다시 시도하거나 건너뛰기를 눌러주세요.");
		} finally {
			setIsSaving(false);
		}
	}

	function next() {
		if (step < finalQuestionStep) {
			setStep((s) => s + 1);
			return;
		}
		if (step === finalQuestionStep) {
			saveProfile();
		}
	}

	function skipStep() {
		if (step < finalQuestionStep) {
			setStep((s) => s + 1);
			return;
		}
		if (step === finalQuestionStep) {
			saveProfile();
		}
	}

	function back() {
		if (step > 0 && step < totalSteps - 1) {
			setStep((s) => s - 1);
		}
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
		"w-full rounded-3xl border border-dotori-100 bg-dotori-50 px-5 py-4 text-base outline-none transition-all focus:border-dotori-200 focus:bg-white focus:ring-2 focus:ring-dotori-300";
	const sliderCls =
		"h-2 w-full cursor-pointer appearance-none rounded-full bg-dotori-200 accent-dotori-500";

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
					{step > 0 && step < totalSteps - 1 ? (
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
					<p className="pt-4 text-sm text-dotori-400">
					{Math.min(step + 1, totalSteps)}/{totalSteps}
				</p>
			</header>

			{/* ── 단계 인디케이터 ── */}
			<div className="mt-2">
				<div className="h-1 rounded-full bg-dotori-100">
					<div
						className="h-1 rounded-full bg-dotori-500 transition-all duration-300"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>
			<div className="mt-3 rounded-2xl border border-dotori-100 bg-white/90 px-4 py-3 shadow-sm">
				<div className="flex items-center justify-between">
						<Badge color="dotori" className="text-xs font-semibold">
						AI 맞춤 온보딩
					</Badge>
					<p className="text-xs font-medium text-dotori-500">{activeGuide.eta}</p>
				</div>
				<p className="mt-2 text-sm font-semibold text-dotori-800">{activeGuide.label}</p>
				<p className="mt-1 text-xs leading-relaxed text-dotori-500">{activeGuide.hint}</p>
			</div>

			{/* ── 컨텐츠 ── */}
			<div className="mt-4 flex-1 rounded-[30px] border border-dotori-100 bg-white/90 px-4 py-5 shadow-[0_12px_28px_rgba(200,149,106,0.10)]">
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
								<p className="mt-1 text-sm text-dotori-400">
								맞춤 입소 전략을 위해 필요해요
							</p>
						</div>

						<div>
								<label className="mb-2 block text-sm font-medium text-dotori-500">
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
								<label className="mb-2 block text-sm font-medium text-dotori-500">
								출생년도
							</label>
							<div className="rounded-3xl bg-dotori-100/70 px-4 py-3">
								<div className="mb-2 flex items-center justify-between">
									<span className="font-semibold text-dotori-700">
										{birthYear}년
									</span>
									{childAge !== null ? (
											<span className="text-xs text-dotori-500">
											만 {childAge}세
										</span>
									) : (
											<span className="text-xs text-dotori-400">
											월을 선택해 만 나이를 확인하세요
										</span>
									)}
								</div>
								<input
									type="range"
									min={birthYearOptionsRange.minYear}
									max={birthYearOptionsRange.maxYear}
									step={1}
									value={birthYear}
									onChange={(e) => setBirthYear(e.target.value)}
									className={sliderCls}
								/>
							</div>
						</div>
						<div>
								<label className="mb-2 block text-sm font-medium text-dotori-500">
								생월
							</label>
							<select
								value={birthMonth}
								onChange={(e) => setBirthMonth(e.target.value)}
								className={cn(inputCls, !birthMonth && "text-dotori-400")}
							>
								<option value="">월 선택</option>
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
						<div>
								<label className="mb-2 block text-sm font-medium text-dotori-500">
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
											"flex-1 rounded-3xl py-3.5 text-base font-medium transition-all active:scale-[0.97]",
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
								<p className="mt-1 text-sm text-dotori-400">
								주변 시설을 찾기 위해 필요해요
							</p>
						</div>

						<div>
								<label className="mb-2 block text-sm font-medium text-dotori-500">
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
								{popularSidoOptions
									.filter((s) => orderedSidoList.includes(s))
									.map((s) => (
										<option key={`popular-${s}`} value={s}>
											{`${s} (인기)`}
										</option>
									))}
								{orderedSidoList
									.filter((s) => !popularSidoOptions.includes(s))
									.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
							</select>
								<p className="mt-2 text-xs text-dotori-500">
								현재 시/도: {sido || "미선택"}
							</p>
						</div>
						<div>
								<label className="mb-2 block text-sm font-medium text-dotori-500">
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
								<p className="mt-2 text-xs text-dotori-500">
								현재 시/군/구: {sigungu || "미선택"}
							</p>
						</div>
						<div>
								<label className="mb-2 block text-sm font-medium text-dotori-500">
								동/읍/면 (선택)
							</label>
							<input
								type="text"
								value={dong}
								onChange={(e) => setDong(e.target.value)}
								placeholder="역삼동"
								className={inputCls}
							/>
								<p className="mt-2 text-xs text-dotori-500">
								현재 동/읍/면: {dong || "미입력"}
							</p>
							{sido || sigungu || dong ? (
								<p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-dotori-600">
									선택된 지역: {sido || "미선택"}
									{sido && sigungu ? ` / ${sigungu}` : ""}
									{dong ? ` / ${dong}` : ""}
								</p>
							) : null}
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
								<p className="mt-1 text-sm text-dotori-400">
								여러 개 선택할 수 있어요
							</p>
						</div>

						<div>
								<label className="mb-2 block text-sm font-medium text-dotori-500">
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
											"rounded-full px-5 py-3 text-base font-medium transition-all active:scale-[0.97]",
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
								<label className="mb-2 block text-sm font-medium text-dotori-500">
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
											"rounded-full px-5 py-3 text-base font-medium transition-all active:scale-[0.97]",
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

					{step === 3 && (
						<div
							key="step3"
							className="space-y-6 px-1 pt-2 text-center"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={BRAND.appIconWarm}
								alt=""
							className="mx-auto h-11 w-11"
						/>
						<div>
							<h1 className="text-xl font-bold">
								빈자리 생기면 바로 알려드려요
							</h1>
							<p className="mt-2 text-sm text-dotori-500">
								관심 시설에 공석이 생기면 즉시 푸시 알림으로 놓치지 않게
								도와드려요.
							</p>
						</div>
						<div className="rounded-3xl bg-white p-5 text-left shadow-sm">
							<p className="text-sm font-semibold text-dotori-700">가격 안내</p>
							<Badge
								color="forest"
								className="mt-2 inline-flex text-sm"
							>
								월 1,900원으로 시작
							</Badge>
								<p className="mt-2 text-xs leading-relaxed text-dotori-500">
								빈자리 알림은 무료 체험 후 원할 경우 계속 이용할 수 있어요.
							</p>
						</div>
					</div>
				)}

				{step === 4 && (
					<div
						key="step4"
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
								토리챗 AI가 이동 전략을 짜줘요
							</h1>
								<p className="mt-1 text-sm text-dotori-400">
								입소 가능성, 이사 일정, 대기순위까지 한 번에 정리해드려요.
							</p>
						</div>
						<div className="space-y-3 rounded-3xl bg-white p-5 text-left shadow-sm">
							<div className="rounded-2xl border border-dotori-100 bg-dotori-50 p-4">
								<p className="text-sm text-dotori-500">
									전문 상담사가 놓친 부분까지 AI가 점검해서
									실행 가능한 이동 플랜을 제안해요.
								</p>
							</div>
							<div className="rounded-2xl border border-dotori-100 bg-dotori-50 p-4">
								<p className="text-sm text-dotori-500">
									우선순위 시설부터 서류 준비 순서까지 안내받고,
									부모님의 일정을 더 편하게 관리해보세요.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* ── 하단 CTA ── */}
			<div className="pb-8 pt-5">
				{saveError && (
						<div className="mb-3 rounded-2xl bg-dotori-100 px-4 py-3 text-xs text-dotori-700">
						{saveError}
					</div>
				)}
				{step < totalSteps - 1 ? (
					<>
						<Button
							color="dotori"
							onClick={next}
							disabled={isSaving}
							className={cn(
									"w-full py-4.5 text-base font-semibold transition-all active:scale-[0.98]",
								isSaving && "opacity-60",
							)}
						>
							{isSaving
								? "저장 중..."
								: "다음"}
						</Button>
						<button
							type="button"
							onClick={skipStep}
							disabled={isSaving}
							className="mt-2 w-full text-xs text-dotori-400 transition-colors hover:text-dotori-600 disabled:opacity-50"
						>
							무료로 먼저 체험하기
						</button>
					</>
				) : (
					<div className="space-y-3">
						<Button
							color="dotori"
							onClick={() => router.push("/")}
							className="w-full py-4.5 text-base font-semibold"
						>
							무료로 시작하기
						</Button>
						<button
							type="button"
							onClick={() => router.push("/my/settings")}
							className="w-full rounded-full border border-forest-200 py-3.5 text-sm font-medium text-forest-700 transition-colors hover:border-forest-300 hover:text-forest-800"
						>
							프리미엄 보기
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
