<script lang="ts">
	import PricingCard from '$lib/components/PricingCard.svelte';
	import { pricingPackages } from '$lib/data/pricing';
	import {
		boundedDragOffset,
		clampIndex,
		getPointerVelocity,
		peekCarouselLayout,
		pushPointerSample,
		resolveSwipeIntent,
		SWIPE_DRAG_PX,
		SWIPE_LOCK_PX,
		type PointerSample
	} from '$lib/utils/carousel';

	const packages = pricingPackages;
	const CARD_PX = 272;
	const GAP_PX = 16;
	const defaultIndex = Math.max(0, packages.findIndex((p) => p.id === 'engagement'));

	let {
		class: className = ''
	}: {
		class?: string;
	} = $props();

	let root = $state<HTMLElement | null>(null);
	let viewport = $state<HTMLElement | null>(null);
	let width = $state(0);
	let revealed = $state(false);
	let index = $state(defaultIndex);
	let dragOffset = $state(0);
	let isDragging = $state(false);

	let startX = 0;
	let dragged = false;
	let skipPointer = false;
	let samples: PointerSample[] = [];
	let activePointerId: number | null = null;

	const layout = $derived(
		peekCarouselLayout({
			viewportWidth: width,
			cardPx: CARD_PX,
			gap: GAP_PX,
			index,
			count: packages.length
		})
	);
	const targetOffset = $derived(layout.targetOffset);
	const trackOffset = $derived(targetOffset + (isDragging ? dragOffset : 0));
	const current = $derived(packages[index] ?? packages[0]);

	$effect(() => {
		if (!root) return;

		let revealFrame = 0;

		function scheduleReveal(measuredWidth: number) {
			if (measuredWidth <= 0 || revealed) return;

			cancelAnimationFrame(revealFrame);
			revealFrame = requestAnimationFrame(() => {
				revealFrame = requestAnimationFrame(() => {
					revealed = true;
				});
			});
		}

		const ro = new ResizeObserver(([entry]) => {
			width = entry.contentRect.width;
			scheduleReveal(entry.contentRect.width);
		});
		ro.observe(root);
		width = root.clientWidth;
		scheduleReveal(root.clientWidth);

		return () => {
			ro.disconnect();
			cancelAnimationFrame(revealFrame);
		};
	});

	function emphasis(cardIndex: number) {
		const d = Math.abs(cardIndex - index);
		if (d === 0) return { active: true, opacity: 1, scale: 1 };
		if (d === 1) return { active: false, opacity: 0.88, scale: 0.98 };
		return { active: false, opacity: 0.8, scale: 0.96 };
	}

	function tapZone(clientX: number): 'prev' | 'next' | null {
		if (!viewport || width <= 0) return null;

		const rect = viewport.getBoundingClientRect();
		const x = clientX - rect.left;
		const cardLeft = (rect.width - CARD_PX) / 2;
		const cardRight = cardLeft + CARD_PX;

		if (x < cardLeft) return 'prev';
		if (x > cardRight) return 'next';
		return null;
	}

	function isInteractiveTarget(target: EventTarget | null) {
		return target instanceof Element && !!target.closest('a, button');
	}

	function goTo(next: number) {
		index = clampIndex(next, packages.length);
		dragOffset = 0;
	}

	function goPrev() {
		if (index > 0) goTo(index - 1);
		else dragOffset = 0;
	}

	function goNext() {
		if (index < packages.length - 1) goTo(index + 1);
		else dragOffset = 0;
	}

	function onPointerDown(e: PointerEvent) {
		skipPointer = isInteractiveTarget(e.target);
		if (skipPointer || width <= 0 || (e.pointerType === 'mouse' && e.button !== 0)) return;
		isDragging = true;
		dragged = false;
		startX = e.clientX;
		samples = [{ x: e.clientX, t: performance.now() }];
		activePointerId = e.pointerId;
		viewport?.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging || activePointerId !== e.pointerId) return;
		const dx = e.clientX - startX;
		if (Math.abs(dx) > SWIPE_LOCK_PX) {
			e.preventDefault();
			dragOffset = boundedDragOffset(dx, index === 0, index === packages.length - 1);
		}
		pushPointerSample(samples, e.clientX, performance.now());
		if (Math.abs(dx) > SWIPE_DRAG_PX) dragged = true;
	}

	function onPointerUp(e: PointerEvent) {
		if (skipPointer) {
			skipPointer = false;
			return;
		}
		if (!isDragging || activePointerId !== e.pointerId) return;

		viewport?.releasePointerCapture(e.pointerId);
		activePointerId = null;
		isDragging = false;

		if (dragged) {
			const intent = resolveSwipeIntent({
				displacement: e.clientX - startX,
				velocity: getPointerVelocity(samples),
				width: layout.stride
			});
			if (intent === 'prev') goPrev();
			else if (intent === 'next') goNext();
			else dragOffset = 0;
			return;
		}
		const zone = tapZone(e.clientX);
		if (zone === 'prev') goPrev();
		else if (zone === 'next') goNext();
		else dragOffset = 0;
	}

	function onPointerCancel(e: PointerEvent) {
		if (skipPointer) {
			skipPointer = false;
			return;
		}
		if (activePointerId !== e.pointerId) return;
		viewport?.releasePointerCapture(e.pointerId);
		activePointerId = null;
		isDragging = false;
		dragOffset = 0;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			goPrev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			goNext();
		}
	}
</script>

<div bind:this={root} class={['w-full', className]}>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="relative outline-none"
		role="group"
		aria-label="Pricing packages"
		aria-roledescription="carousel"
		tabindex="0"
		onkeydown={onKeydown}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerCancel}
	>
		<div
			class={['pricing-carousel-reveal', revealed && 'pricing-carousel-reveal--in']}
			aria-hidden={!revealed}
		>
			<div
				bind:this={viewport}
				class={[
					'pricing-carousel-mask overflow-hidden touch-pan-y',
					isDragging ? 'cursor-grabbing' : 'cursor-grab'
				]}
			>
				<div
					class="box-border flex items-stretch select-none"
					style:gap="{GAP_PX}px"
					style:padding-left="{layout.sidePad}px"
					style:padding-right="{layout.sidePad}px"
					style:width="{layout.trackWidth + layout.sidePad * 2}px"
					style:transform="translate3d({trackOffset}px, 0, 0)"
					style:transition={revealed && !isDragging
						? 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
						: 'none'}
				>
					{#each packages as pkg, i (pkg.id)}
						{@const e = emphasis(i)}
						<div
							class={[
								'shrink-0',
								revealed ? 'transition-[opacity,transform] duration-300' : ''
							]}
							style:width="{CARD_PX}px"
							style:opacity={e.opacity}
							style:transform="scale({e.scale})"
							aria-hidden={!e.active}
						>
							<PricingCard {pkg} active={e.active} />
						</div>
					{/each}
				</div>
			</div>

			<p class="text-caption mt-6 text-center text-ink-muted">
				{current.name}
				<span class="text-ink/35"> · </span>
				{index + 1} / {packages.length}
			</p>
		</div>
	</div>
</div>

<style>
	.pricing-carousel-reveal {
		opacity: 0;
		transform: translateY(12px);
		pointer-events: none;
	}

	.pricing-carousel-reveal--in {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
		transition:
			opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.pricing-carousel-mask {
		mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 6%,
			black 94%,
			transparent 100%
		);
	}
</style>
