"use client";

import { BRAND } from "@/lib/brand-assets";
import { apiFetch } from "@/lib/api";
import { fadeUp, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
	ChevronDownIcon,
	ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/catalyst/button";
import { Badge } from "@/components/catalyst/badge";
import { motion } from "motion/react";
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
		"w-full min-h-11 rounded-3xl border border-dotori-100 bg-dotori-50 px-5 py-4 text-base text-dotori-900 outline-none ring-1 ring-dotori-200 transition-all placeholder:text-dotori-500 focus:border-dotori-200 focus:bg-white focus:ring-2 focus:ring-dotori-300 dark:border-dotori-800 dark:bg-dotori-900 dark:text-dotori-50 dark:placeholder:text-dotori-600 dark:ring-dotori-800 dark:focus:border-dotori-700 dark:focus:bg-dotori-950 dark:focus:ring-dotori-700";
	const sliderCls =
		"h-2 w-full cursor-pointer appearance-none rounded-lg bg-dotori-100 accent-dotori-500 dark:bg-dotori-700 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dotori-400 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-lg [&::-webkit-slider-runnable-track]:bg-dotori-100 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-dotori-400 [&::-moz-range-thumb]:shadow-md [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:bg-dotori-100";
	const choicePillBase =
		"inline-flex min-h-12 items-center justify-center rounded-full px-5 text-body-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dotori-950";
	const segmentedChoiceBase =
		"inline-flex min-h-12 flex-1 items-center justify-center rounded-3xl px-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dotori-950";

	function summarizeChoices(list: string[]) {
		if (list.length === 0) return "미선택";
		const shown = list.slice(0, 2).join(" · ");
		if (list.length <= 2) return shown;
		return `${shown} 외 ${list.length - 2}개`;
	}

	return (
		<div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-dotori-50 px-6 text-dotori-900 dark:bg-dotori-900 dark:text-dotori-50">
			{/* ── 워터마크 장식 ── */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 select-none opacity-[0.04]"
			/>

			{/* ── 헤더 ── */}
			<header className="flex items-center justify-between pb-2 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
				{step > 0 && step < totalSteps - 1 ? (
					<button
						type="button"
						onClick={back}
						aria-label="뒤로 가기"
						className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-800"
					>
						<ArrowLeftIcon className="h-6 w-6" />
					</button>
				) : (
					<div className="h-11 w-11" />
				)}
				<p className="text-body-sm font-medium text-dotori-500">
					{Math.min(step + 1, totalSteps)}/{totalSteps}
				</p>
			</header>

			{/* ── 단계 인디케이터 ── */}
			<div className="mt-1">
				<div
					role="progressbar"
					aria-label="온보딩 진행률"
					aria-valuemin={1}
					aria-valuemax={totalSteps}
					aria-valuenow={Math.min(step + 1, totalSteps)}
					className="h-1.5 rounded-full bg-dotori-100 dark:bg-dotori-800"
				>
					<div
						className="h-1.5 rounded-full bg-dotori-500 transition-all duration-300"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>
			<div className="mt-3 rounded-3xl border border-dotori-100 bg-white/90 p-5 shadow-sm dark:border-dotori-800 dark:bg-dotori-950/80 dark:shadow-none">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-dotori-900 text-body-sm font-bold text-white dark:bg-dotori-50 dark:text-dotori-900">
							{String(Math.min(step + 1, totalSteps)).padStart(2, "0")}
						</div>
						<div>
							<p className="text-caption font-semibold text-dotori-500">
								AI 맞춤 온보딩
							</p>
							<p className="mt-0.5 text-h2 font-bold text-dotori-900 dark:text-dotori-50">
								{activeGuide.label}
							</p>
						</div>
					</div>
					<Badge color="dotori" className="shrink-0 text-caption font-semibold">
						{activeGuide.eta}
					</Badge>
				</div>
				<p className="mt-2 text-body-sm leading-relaxed text-dotori-500">
					{activeGuide.hint}
				</p>
			</div>

			{/* ── 컨텐츠 ── */}
			<div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-3xl border border-dotori-100 bg-white/90 p-5 shadow-sm dark:border-dotori-800 dark:bg-dotori-950/80 dark:shadow-none">
				{step === 0 && (
					<motion.div
						key="step0"
						{...fadeUp}
						className="space-y-4"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt=""
							className="h-10 w-10"
						/>
						<div>
							<h1 className="text-h1 font-bold tracking-tight">
								아이 정보를 알려주세요
							</h1>
							<p className="mt-1 text-body-sm text-dotori-500">
								맞춤 입소 전략을 위해 필요해요
							</p>
						</div>

						<div>
							<label htmlFor="onboarding-child-name" className="mb-2 block text-body-sm font-medium text-dotori-500">
								아이 이름
							</label>
							<input
								id="onboarding-child-name"
								type="text"
								value={childName}
								onChange={(e) => setChildName(e.target.value)}
								placeholder="이름을 입력하세요"
								className={inputCls}
							/>
						</div>
						<div>
							<label htmlFor="onboarding-birth-year" className="mb-2 block text-body-sm font-medium text-dotori-500">
								출생년도
							</label>
							<div className="rounded-3xl bg-dotori-100/70 px-4 py-3 dark:bg-dotori-800/60">
								<div className="mb-2 flex items-center justify-between">
									<span className="font-semibold text-dotori-700 dark:text-dotori-200">
										{birthYear}년
									</span>
									{childAge !== null ? (
										<span className="text-caption text-dotori-500">
											만 {childAge}세
										</span>
									) : (
										<span className="text-caption text-dotori-500">
											월을 선택해 만 나이를 확인하세요
										</span>
									)}
								</div>
								<input
									id="onboarding-birth-year"
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
						<label htmlFor="onboarding-birth-month" className="mb-2 block text-body-sm font-medium text-dotori-500">
							생월
						</label>
						<div className="relative">
							<select
								id="onboarding-birth-month"
								value={birthMonth}
								onChange={(e) => setBirthMonth(e.target.value)}
								className={cn(
									inputCls,
									"appearance-none pr-11 text-right",
									!birthMonth && "text-dotori-500",
								)}
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
							<ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dotori-500" />
						</div>
					</div>
						<div>
							<label className="mb-2 block text-body-sm font-medium text-dotori-500">
								성별
							</label>
							<div className="flex gap-2" role="radiogroup" aria-label="성별 선택">
								{["여아", "남아", "선택안함"].map((g) => (
									<motion.button
										key={g}
										type="button"
										role="radio"
										aria-checked={gender === g}
											aria-label={`성별 ${g}`}
											onClick={() => setGender(g)}
											{...tap.button}
											className={cn(
												segmentedChoiceBase,
												gender === g
													? "bg-dotori-50 text-dotori-900 ring-2 ring-dotori-400 ring-offset-2 ring-offset-white dark:bg-dotori-800 dark:text-dotori-50 dark:ring-dotori-300 dark:ring-offset-dotori-950"
													: "border border-dotori-200 bg-white text-dotori-700 hover:border-dotori-300 hover:bg-dotori-50 dark:border-dotori-800 dark:bg-dotori-950 dark:text-dotori-200 dark:hover:bg-dotori-900/40",
											)}
										>
										{g}
									</motion.button>
								))}
							</div>
						</div>
					</motion.div>
				)}

				{step === 1 && (
					<motion.div
						key="step1"
						{...fadeUp}
						className="space-y-4"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt=""
							className="h-10 w-10"
						/>
						<div>
							<h1 className="text-h1 font-bold tracking-tight">
								거주 지역을 알려주세요
							</h1>
							<p className="mt-1 text-body-sm text-dotori-500">
								주변 시설을 찾기 위해 필요해요
							</p>
						</div>

						<div>
							<label htmlFor="onboarding-sido" className="mb-2 block text-body-sm font-medium text-dotori-500">
								시/도
							</label>
							<select
								id="onboarding-sido"
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
							<p className="mt-2 text-caption text-dotori-500">
								현재 시/도: {sido || "미선택"}
							</p>
						</div>
						<div>
							<label htmlFor="onboarding-sigungu" className="mb-2 block text-body-sm font-medium text-dotori-500">
								시/군/구
							</label>
							<select
								id="onboarding-sigungu"
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
							{sido && !isLoadingSigungu && sigunguList.length === 0 ? (
								<div className="mt-3 rounded-3xl border border-dotori-100 bg-dotori-50 p-4 dark:border-dotori-800 dark:bg-dotori-900/40">
									<p className="text-body-sm font-semibold text-dotori-800 dark:text-dotori-100">
										시/군/구 목록을 아직 불러오지 못했어요
									</p>
									<p className="mt-1 text-caption leading-relaxed text-dotori-500">
										네트워크 상태를 확인한 뒤 다시 시도해볼까요?
									</p>
									<motion.button
										type="button"
										onClick={() => loadSigungu(sido)}
										{...tap.button}
										className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-dotori-200 bg-white text-body-sm font-semibold text-dotori-800 hover:bg-dotori-50 dark:border-dotori-800 dark:bg-dotori-950 dark:text-dotori-100 dark:hover:bg-dotori-900/40"
									>
										다시 불러오기
									</motion.button>
								</div>
							) : null}
							<p className="mt-2 text-caption text-dotori-500">
								현재 시/군/구: {sigungu || "미선택"}
							</p>
						</div>
						<div>
							<label htmlFor="onboarding-dong" className="mb-2 block text-body-sm font-medium text-dotori-500">
								동/읍/면 (선택)
							</label>
							<input
								id="onboarding-dong"
								type="text"
								value={dong}
								onChange={(e) => setDong(e.target.value)}
								placeholder="역삼동"
								className={inputCls}
							/>
							<p className="mt-2 text-caption text-dotori-500">
								현재 동/읍/면: {dong || "미입력"}
							</p>
							{sido || sigungu || dong ? (
								<p className="mt-3 rounded-2xl bg-white px-4 py-3 text-body-sm text-dotori-600 dark:bg-dotori-950 dark:text-dotori-300">
									선택된 지역: {sido || "미선택"}
									{sido && sigungu ? ` / ${sigungu}` : ""}
									{dong ? ` / ${dong}` : ""}
								</p>
							) : null}
						</div>
					</motion.div>
				)}

				{step === 2 && (
					<motion.div
						key="step2"
						{...fadeUp}
						className="space-y-4"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt=""
							className="h-10 w-10"
						/>
						<div>
							<h1 className="text-h1 font-bold tracking-tight">
								관심 유형을 선택하세요
							</h1>
							<p className="mt-1 text-body-sm text-dotori-500">
								여러 개 선택할 수 있어요
							</p>
						</div>

						<div>
							<label className="mb-2 block text-body-sm font-medium text-dotori-500">
								시설 유형
							</label>
							<div className="flex flex-wrap gap-2">
								{facilityTypes.map((type) => (
									<motion.button
										key={type}
										type="button"
										aria-pressed={selectedTypes.includes(type)}
										onClick={() =>
											toggle(
												selectedTypes,
												setSelectedTypes,
												type,
											)
										}
										{...tap.button}
										className={cn(
											choicePillBase,
											selectedTypes.includes(type)
												? "bg-dotori-900 text-white ring-2 ring-dotori-400 ring-offset-2 ring-offset-white dark:bg-dotori-50 dark:text-dotori-900 dark:ring-offset-dotori-950"
												: "border border-dotori-200 bg-white text-dotori-700 hover:border-dotori-300 hover:bg-dotori-50 dark:border-dotori-800 dark:bg-dotori-950 dark:text-dotori-200 dark:hover:bg-dotori-900/40",
										)}
									>
										{type}
									</motion.button>
								))}
							</div>
						</div>
						<div>
							<label className="mb-2 block text-body-sm font-medium text-dotori-500">
								관심 특징
							</label>
							<div className="flex flex-wrap gap-2">
								{features.map((feat) => (
									<motion.button
										key={feat}
										type="button"
										aria-pressed={selectedFeatures.includes(feat)}
										onClick={() =>
											toggle(
												selectedFeatures,
												setSelectedFeatures,
												feat,
											)
										}
										{...tap.button}
										className={cn(
											choicePillBase,
											selectedFeatures.includes(feat)
												? "bg-dotori-900 text-white ring-2 ring-dotori-400 ring-offset-2 ring-offset-white dark:bg-dotori-50 dark:text-dotori-900 dark:ring-offset-dotori-950"
												: "border border-dotori-200 bg-white text-dotori-700 hover:border-dotori-300 hover:bg-dotori-50 dark:border-dotori-800 dark:bg-dotori-950 dark:text-dotori-200 dark:hover:bg-dotori-900/40",
										)}
									>
										{feat}
									</motion.button>
								))}
							</div>
						</div>
					</motion.div>
				)}

				{step === 3 && (
					<motion.div key="step3" {...fadeUp} className="space-y-4 text-center">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.appIconWarm} alt="" className="mx-auto h-11 w-11" />
						<div>
							<h1 className="text-h1 font-bold tracking-tight">빈자리 생기면 바로 알려드려요</h1>
							<p className="mt-2 text-body-sm text-dotori-500">
								관심 시설에 공석이 생기면 즉시 푸시 알림으로 놓치지 않게
								도와드려요.
							</p>
						</div>
						<div className="rounded-3xl bg-white p-5 text-left shadow-sm dark:border dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
							<p className="text-body-sm font-semibold text-dotori-700 dark:text-dotori-200">
								가격 안내
							</p>
							<Badge color="forest" className="mt-2 inline-flex text-body-sm">
								월 1,900원으로 시작
							</Badge>
							<p className="mt-2 text-caption leading-relaxed text-dotori-500">
								빈자리 알림은 무료 체험 후 원할 경우 계속 이용할 수 있어요.
							</p>
						</div>
					</motion.div>
				)}

				{step === 4 && (
					<motion.div
						key="step4"
						{...fadeUp}
						className="space-y-4"
					>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt=""
							className="h-10 w-10"
						/>
						<div>
							<h1 className="text-h1 font-bold tracking-tight">
								토리챗 AI가 이동 전략을 짜줘요
							</h1>
							<p className="mt-1 text-body-sm text-dotori-500">
								입소 가능성, 이사 일정, 대기순위까지 한 번에 정리해드려요.
							</p>
						</div>
						<div className="space-y-3 rounded-3xl bg-white p-5 text-left shadow-sm dark:border dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
							<div className="rounded-2xl border border-dotori-100 bg-dotori-50 p-4 dark:border-dotori-800 dark:bg-dotori-900">
								<p className="text-body-sm text-dotori-500">
									전문 상담사가 놓친 부분까지 AI가 점검해서
									실행 가능한 이동 플랜을 제안해요.
								</p>
							</div>
							<div className="rounded-2xl border border-dotori-100 bg-dotori-50 p-4 dark:border-dotori-800 dark:bg-dotori-900">
								<p className="text-body-sm text-dotori-500">
									우선순위 시설부터 서류 준비 순서까지 안내받고,
									부모님의 일정을 더 편하게 관리해보세요.
								</p>
							</div>
						</div>
					</motion.div>
				)}

				{step === totalSteps - 1 && (
					<motion.div key="done" {...fadeUp} className="space-y-4 text-center">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.appIconWarm} alt="" className="mx-auto h-12 w-12" />
						<div>
							<h1 className="text-h1 font-bold tracking-tight">준비 끝! 이제 시작해볼까요?</h1>
							<p className="mt-2 text-body-sm text-dotori-500">
								입력한 정보는 언제든 <span className="font-semibold text-dotori-700 dark:text-dotori-200">마이 &gt; 설정</span>에서 바꿀 수 있어요.
							</p>
						</div>

						<div className="rounded-3xl border border-dotori-100 bg-dotori-50 p-5 text-left dark:border-dotori-800 dark:bg-dotori-900/40">
							<p className="text-body-sm font-semibold text-dotori-800 dark:text-dotori-100">
								요약
							</p>
							<dl className="mt-3 space-y-2 text-body-sm">
								<div className="flex items-start justify-between gap-3">
									<dt className="text-dotori-500">아이</dt>
									<dd className="text-right font-semibold text-dotori-800 dark:text-dotori-100">
										{childName ? childName : "미입력"}
									</dd>
								</div>
								<div className="flex items-start justify-between gap-3">
									<dt className="text-dotori-500">지역</dt>
									<dd className="text-right font-semibold text-dotori-800 dark:text-dotori-100">
										{sido ? `${sido}${sigungu ? ` / ${sigungu}` : ""}${dong ? ` / ${dong}` : ""}` : "미선택"}
									</dd>
								</div>
								<div className="flex items-start justify-between gap-3">
									<dt className="text-dotori-500">시설 유형</dt>
									<dd className="text-right font-semibold text-dotori-800 dark:text-dotori-100">
										{summarizeChoices(selectedTypes)}
									</dd>
								</div>
								<div className="flex items-start justify-between gap-3">
									<dt className="text-dotori-500">관심 특징</dt>
									<dd className="text-right font-semibold text-dotori-800 dark:text-dotori-100">
										{summarizeChoices(selectedFeatures)}
									</dd>
								</div>
							</dl>
						</div>
					</motion.div>
				)}
			</div>

			{/* ── 하단 CTA ── */}
			<div className="sticky bottom-0 pt-4 pb-[env(safe-area-inset-bottom)]">
				{saveError && (
					<div className="mb-3 rounded-2xl bg-dotori-100 px-4 py-3 text-caption text-dotori-700 dark:bg-dotori-800 dark:text-dotori-200">
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
								"w-full min-h-12 bg-dotori-900 text-base font-semibold text-white transition-all hover:bg-dotori-950 active:scale-[0.98] disabled:hover:bg-dotori-900",
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
							className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-caption font-semibold text-dotori-500 transition-colors hover:text-dotori-600 disabled:opacity-50 dark:hover:text-dotori-300"
						>
							무료로 먼저 체험하기
						</button>
					</>
				) : (
					<div className="space-y-3">
						<Button
							color="dotori"
							onClick={() => router.push("/")}
							className="w-full min-h-12 bg-dotori-900 text-base font-semibold text-white hover:bg-dotori-950 active:scale-[0.98]"
						>
							무료로 시작하기
						</Button>
						<button
							type="button"
							onClick={() => router.push("/my/settings")}
							className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-forest-200 text-body-sm font-semibold text-forest-700 transition-all hover:border-forest-300 hover:text-forest-800 active:scale-[0.98]"
						>
							프리미엄 보기
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
