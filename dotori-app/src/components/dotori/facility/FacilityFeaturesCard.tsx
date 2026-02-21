interface FacilityFeaturesCardProps {
	features: string[];
}

export function FacilityFeaturesCard({ features }: FacilityFeaturesCardProps) {
	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm motion-safe:animate-in motion-safe:fade-in duration-300">
			<h3 className="mb-3 font-semibold">특징 &amp; 프로그램</h3>
			<div className="flex flex-wrap gap-2">
				{features.map((feat) => (
					<span
						key={feat}
						className="rounded-full bg-dotori-50 px-3.5 py-2 text-[14px] font-medium text-dotori-600"
					>
						{feat}
					</span>
				))}
			</div>
		</section>
	);
}
