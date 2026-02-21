"use client";

import {
	Disclosure,
	DisclosureButton,
	DisclosurePanel,
} from "@headlessui/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

export function FAQ({
	items,
}: {
	items: { question: string; answer: string }[];
}) {
      return (
		<div className="divide-y divide-dotori-200">
			{items.map((item, i) => (
				<Disclosure key={i} as="div">
							{({ open }) => (
								<>
									<DisclosureButton className="flex w-full items-center justify-between py-4 text-left">
										<span className="text-[15px] font-medium text-dotori-950">
											{item.question}
										</span>
								{open ? (
									<MinusIcon className="h-5 w-5 shrink-0 text-dotori-500" />
								) : (
									<PlusIcon className="h-5 w-5 shrink-0 text-dotori-400" />
								)}
							</DisclosureButton>
							<DisclosurePanel className="pb-4 pr-12">
								<div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-dotori-600">
									{item.answer}
								</div>
							</DisclosurePanel>
						</>
					)}
				</Disclosure>
			))}
		</div>
	);
}
