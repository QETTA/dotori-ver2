"use client";

import {
	ArrowLeftIcon,
	CameraIcon,
	CheckCircleIcon,
	DevicePhoneMobileIcon,
	DocumentArrowUpIcon,
	PhotoIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import { openIsalangApp, ISALANG_PORTAL } from "@/lib/external/isalang-api";
import { cn } from "@/lib/utils";

interface ExtractedItem {
	facilityName: string;
	waitlistNumber: number | null;
	applicationDate: string | null;
	status: string;
	childClass: string | null;
	childName: string | null;
	facilityType: string | null;
	_confirmed?: boolean;
}

type Step = "guide" | "upload" | "extracting" | "review" | "saving" | "done";

export default function ImportPage() {
	const { addToast } = useToast();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [step, setStep] = useState<Step>("guide");
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [items, setItems] = useState<ExtractedItem[]>([]);
	const [error, setError] = useState<string | null>(null);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			// Validate
			if (!file.type.startsWith("image/")) {
				setError("이미지 파일만 업로드할 수 있어요");
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				setError("10MB 이하 이미지만 가능해요");
				return;
			}

			setError(null);
			setImageFile(file);
			setPreviewUrl(URL.createObjectURL(file));
			setStep("upload");
		},
		[],
	);

	const handleExtract = useCallback(async () => {
		if (!imageFile) return;

		setStep("extracting");
		setError(null);

		try {
			const formData = new FormData();
			formData.append("image", imageFile);

			const res = await fetch("/api/ocr/waitlist", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "분석에 실패했어요");
			}

			const json = await res.json();
			const extracted = (json.data?.items || []).map(
				(item: ExtractedItem) => ({
					...item,
					_confirmed: true,
				}),
			);

			if (extracted.length === 0) {
				setError(
					"대기 정보를 찾지 못했어요. 아이사랑 대기현황 페이지의 스크린샷인지 확인해주세요.",
				);
				setStep("upload");
				return;
			}

			setItems(extracted);
			setStep("review");
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "분석에 실패했어요. 다시 시도해주세요.",
			);
			setStep("upload");
		}
	}, [imageFile]);

	const toggleConfirm = useCallback((index: number) => {
		setItems((prev) =>
			prev.map((item, i) =>
				i === index ? { ...item, _confirmed: !item._confirmed } : item,
			),
		);
	}, []);

	const handleSave = useCallback(async () => {
		const confirmed = items.filter((i) => i._confirmed);
		if (confirmed.length === 0) {
			addToast({ type: "error", message: "저장할 항목을 선택해주세요" });
			return;
		}

		setStep("saving");

		try {
			const res = await apiFetch<{
				data: {
					successCount: number;
					skipCount: number;
					totalCount: number;
					results: Array<{ facilityName: string; success: boolean; reason?: string }>;
				};
			}>("/api/waitlist/import", {
				method: "POST",
				body: JSON.stringify({
					items: confirmed.map((item) => ({
						facilityName: item.facilityName,
						waitlistNumber: item.waitlistNumber,
						applicationDate: item.applicationDate,
						status: item.status,
						childClass: item.childClass,
						childName: item.childName,
						facilityType: item.facilityType,
					})),
				}),
			});

			const { successCount, skipCount } = res.data;

			if (successCount > 0) {
				const msg =
					skipCount > 0
						? `${successCount}건 저장, ${skipCount}건 건너뜀`
						: `${successCount}건의 대기 정보를 가져왔어요`;
				addToast({
					type: "success",
					message: msg,
					action: {
						label: "확인하기",
						onClick: () => window.location.assign("/my/waitlist"),
					},
				});
				setStep("done");
			} else {
				setError(
					skipCount > 0
						? "DB에 등록된 시설과 매칭되지 않았어요. 시설명을 확인해주세요."
						: "저장에 실패했어요. 다시 시도해주세요.",
				);
				setStep("review");
			}
		} catch {
			setError("저장에 실패했어요");
			setStep("review");
		}
	}, [items, addToast]);

	const resetAll = useCallback(() => {
		setStep("guide");
		setPreviewUrl(null);
		setImageFile(null);
		setItems([]);
		setError(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, []);

	return (
		<div className="min-h-dvh bg-dotori-50/30">
			{/* 헤더 */}
			<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-4 backdrop-blur-xl">
				<Link href="/my/waitlist" aria-label="뒤로 가기" className="p-1">
					<ArrowLeftIcon className="h-5 w-5" />
				</Link>
				<h1 className="text-[17px] font-bold">아이사랑 데이터 가져오기</h1>
			</header>

			<div className="px-5 pb-32">
				{/* ── Step 1: 가이드 ── */}
				{step === "guide" && (
					<div className="mt-4 space-y-4">
						{/* 아이사랑 앱 열기 */}
						<section className="rounded-3xl bg-white p-5 shadow-sm">
							<div className="flex items-start gap-3">
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dotori-100">
									<span className="text-xl">1</span>
								</div>
								<div>
									<h3 className="font-semibold">아이사랑 앱에서 대기현황 열기</h3>
									<p className="mt-1 text-[13px] text-dotori-500">
										아이사랑 앱 → 로그인 → 대기현황 페이지를 열어주세요
									</p>
								</div>
							</div>
							<button
								onClick={() => openIsalangApp(ISALANG_PORTAL.waitlistStatus)}
								className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-dotori-900 px-4 py-3 text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
							>
								<DevicePhoneMobileIcon className="h-5 w-5" />
								아이사랑 앱 열기
							</button>
						</section>

						{/* 스크린샷 안내 */}
						<section className="rounded-3xl bg-white p-5 shadow-sm">
							<div className="flex items-start gap-3">
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dotori-100">
									<span className="text-xl">2</span>
								</div>
								<div>
									<h3 className="font-semibold">대기현황 스크린샷 찍기</h3>
									<p className="mt-1 text-[13px] text-dotori-500">
										대기 목록이 보이는 화면을 스크린샷으로 캡처해주세요.
										시설명, 대기순번, 상태가 모두 보여야 해요.
									</p>
								</div>
							</div>
							<div className="mt-3 rounded-2xl bg-dotori-50 p-4 text-center">
								<CameraIcon className="mx-auto h-8 w-8 text-dotori-400" />
								<p className="mt-2 text-[12px] text-dotori-400">
									Android: 전원 + 볼륨↓ · iPhone: 전원 + 볼륨↑
								</p>
							</div>
						</section>

						{/* 업로드 */}
						<section className="rounded-3xl bg-white p-5 shadow-sm">
							<div className="flex items-start gap-3">
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest-100 text-forest-700">
									<span className="text-xl">3</span>
								</div>
								<div>
									<h3 className="font-semibold">스크린샷 업로드</h3>
									<p className="mt-1 text-[13px] text-dotori-500">
										AI가 자동으로 대기 정보를 읽어서 도토리에 저장해요
									</p>
								</div>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								capture="environment"
								onChange={handleFileSelect}
								className="hidden"
							/>
							<button
								onClick={() => fileInputRef.current?.click()}
								className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-md transition-all active:scale-[0.97]"
							>
								<PhotoIcon className="h-5 w-5" />
								스크린샷 선택하기
							</button>
						</section>
					</div>
				)}

				{/* ── Step 2: 미리보기 + 분석 시작 ── */}
				{step === "upload" && previewUrl && (
					<div className="mt-4 space-y-4">
						<section className="rounded-3xl bg-white p-5 shadow-sm">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold">업로드한 스크린샷</h3>
								<button
									onClick={resetAll}
									aria-label="다시하기"
									className="p-1 text-dotori-400"
								>
									<XMarkIcon className="h-5 w-5" />
								</button>
							</div>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={previewUrl}
								alt="아이사랑 스크린샷"
								className="mt-3 w-full rounded-2xl border border-dotori-100"
							/>
						</section>

						{error && (
							<div className="rounded-2xl bg-red-50 p-4 text-[13px] text-red-600">
								{error}
							</div>
						)}

						<button
							onClick={handleExtract}
							className="flex w-full items-center justify-center gap-2 rounded-2xl bg-dotori-900 px-4 py-3.5 text-[15px] font-semibold text-white shadow-md transition-all active:scale-[0.97]"
						>
							<DocumentArrowUpIcon className="h-5 w-5" />
							AI로 대기 정보 추출하기
						</button>
					</div>
				)}

				{/* ── Step 3: 추출 중 ── */}
				{step === "extracting" && (
					<div className="mt-16 flex flex-col items-center gap-4">
						<div className="h-12 w-12 animate-spin rounded-full border-4 border-dotori-200 border-t-dotori-500" />
						<p className="text-[15px] font-medium text-dotori-700">
							AI가 대기 정보를 읽고 있어요...
						</p>
						<p className="text-[13px] text-dotori-400">
							보통 5~10초 소요됩니다
						</p>
					</div>
				)}

				{/* ── Step 4: 결과 확인 ── */}
				{step === "review" && items.length > 0 && (
					<div className="mt-4 space-y-3">
						<div className="flex items-center justify-between">
							<h2 className="text-[17px] font-bold">
								추출 결과 ({items.length}건)
							</h2>
							<button
								onClick={resetAll}
								className="text-[13px] text-dotori-400 underline"
							>
								다시하기
							</button>
						</div>

						<p className="text-[13px] text-dotori-500">
							정보가 맞는지 확인하고, 가져올 항목을 선택해주세요
						</p>

						{error && (
							<div className="rounded-2xl bg-red-50 p-4 text-[13px] text-red-600">
								{error}
							</div>
						)}

						{items.map((item, idx) => (
							<button
								key={`${item.facilityName}-${idx}`}
								onClick={() => toggleConfirm(idx)}
								className={cn(
									"w-full rounded-2xl p-4 text-left shadow-sm transition-all active:scale-[0.99]",
									item._confirmed
										? "bg-white ring-2 ring-forest-500"
										: "bg-white/60 opacity-60",
								)}
							>
								<div className="flex items-start gap-3">
									{item._confirmed ? (
										<CheckCircleSolid className="mt-0.5 h-5 w-5 shrink-0 text-forest-500" />
									) : (
										<CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-dotori-300" />
									)}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="font-semibold">
												{item.facilityName}
											</span>
											{item.facilityType && (
												<span className="rounded-full bg-dotori-100 px-2 py-0.5 text-[11px] text-dotori-600">
													{item.facilityType}
												</span>
											)}
										</div>
										<div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-dotori-500">
											{item.waitlistNumber != null && (
												<span>대기순번 {item.waitlistNumber}번</span>
											)}
											<span
												className={cn(
													"font-medium",
													item.status === "대기중"
														? "text-dotori-700"
														: item.status === "입소확정"
															? "text-forest-600"
															: "text-dotori-400",
												)}
											>
												{item.status}
											</span>
											{item.applicationDate && (
												<span>신청일 {item.applicationDate}</span>
											)}
										</div>
										{(item.childName || item.childClass) && (
											<div className="mt-1 text-[12px] text-dotori-400">
												{item.childName && <span>{item.childName}</span>}
												{item.childClass && (
													<span> · {item.childClass}</span>
												)}
											</div>
										)}
									</div>
								</div>
							</button>
						))}

						<button
							onClick={handleSave}
							disabled={!items.some((i) => i._confirmed)}
							className={cn(
								"flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white shadow-md transition-all active:scale-[0.97]",
								items.some((i) => i._confirmed)
									? "bg-forest-600"
									: "bg-dotori-300 cursor-not-allowed",
							)}
						>
							선택한 {items.filter((i) => i._confirmed).length}건 가져오기
						</button>
					</div>
				)}

				{/* ── Step 5: 저장 중 ── */}
				{step === "saving" && (
					<div className="mt-16 flex flex-col items-center gap-4">
						<div className="h-12 w-12 animate-spin rounded-full border-4 border-forest-200 border-t-forest-500" />
						<p className="text-[15px] font-medium text-dotori-700">
							대기 정보를 저장하고 있어요...
						</p>
					</div>
				)}

				{/* ── Step 6: 완료 ── */}
				{step === "done" && (
					<div className="mt-16 flex flex-col items-center gap-4">
						<div className="grid h-16 w-16 place-items-center rounded-full bg-forest-100">
							<CheckCircleSolid className="h-8 w-8 text-forest-600" />
						</div>
						<h2 className="text-[18px] font-bold">가져오기 완료!</h2>
						<p className="text-center text-[14px] text-dotori-500">
							아이사랑 대기 정보가 도토리에 저장되었어요.
							<br />
							이제 도토리에서 대기현황을 한눈에 관리하세요.
						</p>
						<div className="mt-4 flex w-full gap-3">
							<Link
								href="/my/waitlist"
								className="flex-1 rounded-2xl bg-forest-600 px-4 py-3 text-center text-[14px] font-semibold text-white transition-all active:scale-[0.97]"
							>
								대기현황 보기
							</Link>
							<button
								onClick={resetAll}
								className="flex-1 rounded-2xl bg-dotori-100 px-4 py-3 text-center text-[14px] font-medium text-dotori-700 transition-all active:scale-[0.97]"
							>
								추가 가져오기
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
