<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onDestroy } from 'svelte';
	import {
		carouselEdgeInset,
		edgeStripWidth,
		lightboxEdgeChrome,
		lightboxEdgeCurtain,
		lightboxEdgeHover,
		mediaEdgeChrome,
		mediaEdgeHover
	} from '$lib/utils/carousel-edge';
	import {
		animateCarouselValue,
		fullBleedTranslateX,
		getPointerVelocity,
		modIndex,
		pushPointerSample,
		resolveSwipeIntent,
		scrollAnimationDelta,
		SWIPE_DRAG_PX,
		SWIPE_LOCK_PX,
		isVideoControlInteraction,
		type PointerSample,
		type SwipeIntent
	} from '$lib/utils/carousel';

	let {
		count,
		index = $bindable(0),
		slide,
		ontap,
		onswipedown,
		edgeNav = false,
		edgeVariant = 'media',
		class: className = '',
		disabled = false
	}: {
		count: number;
		index?: number;
		slide: Snippet<[number]>;
		ontap?: (event: PointerEvent) => void;
		onswipedown?: () => void;
		edgeNav?: boolean;
		edgeVariant?: 'media' | 'lightbox';
		class?: string;
		disabled?: boolean;
	} = $props();

	let viewport = $state<HTMLDivElement | null>(null);
	let trackArea = $state<HTMLDivElement | null>(null);
	let leftStrip = $state<HTMLDivElement | null>(null);
	let track = $state<HTMLDivElement | null>(null);
	let width = $state(0);
	let height = $state(0);
	let scrollIndex = $state(0);
	let dragY = $state(0);
	let isDragging = $state(false);
	let isAnimating = $state(false);

	let startX = 0;
	let startY = 0;
	let startScrollIndex = 0;
	let axisLock: 'x' | 'y' | null = null;
	let dragged = false;
	let samples: PointerSample[] = [];
	let ySamples: PointerSample[] = [];
	let activePointerId: number | null = null;
	let cancelAnim: (() => void) | null = null;
	let hoveredEdge = $state<'prev' | 'next' | null>(null);

	const MOBILE_EDGE_BREAKPOINT = 640;

	const canSwipe = $derived(count > 1 && !disabled);
	const showEdgeNav = $derived(edgeNav && canSwipe);
	const hasPointerHandlers = $derived(canSwipe || !!ontap || !!onswipedown);
	const trackTouchAction = $derived(onswipedown ? 'none' : canSwipe ? 'pan-y' : 'auto');
	const stripClass = $derived(edgeVariant === 'lightbox' ? lightboxEdgeChrome : mediaEdgeChrome);
	const stripHoverClass = $derived(edgeVariant === 'lightbox' ? lightboxEdgeHover : mediaEdgeHover);
	const isLightboxEdge = $derived(showEdgeNav && edgeVariant === 'lightbox');
	const renderAnchor = $derived(Math.floor(scrollIndex));
	const renderPositions = $derived([renderAnchor - 1, renderAnchor, renderAnchor + 1]);
	const translateX = $derived(canSwipe ? fullBleedTranslateX(scrollIndex, width) : 0);

	$effect(() => {
		if (!trackArea) return;

		const observer = new ResizeObserver(([entry]) => {
			width = entry.contentRect.width;
			height = entry.contentRect.height;
		});
		observer.observe(trackArea);
		width = trackArea.clientWidth;
		height = trackArea.clientHeight;

		return () => observer.disconnect();
	});

	// Keep scroll position aligned when index is set externally (e.g. lightbox opens mid-gallery).
	$effect.pre(() => {
		if (isDragging || isAnimating) return;
		index;
		count;
		scrollIndex = index;
	});

	onDestroy(() => {
		cancelAnimation();
	});

	function resetGesture() {
		isDragging = false;
		axisLock = null;
		activePointerId = null;
		samples = [];
		ySamples = [];
	}

	function releasePointer(event: PointerEvent) {
		if (activePointerId !== event.pointerId) return;
		track?.releasePointerCapture(event.pointerId);
		viewport?.releasePointerCapture(event.pointerId);
		activePointerId = null;
	}

	function cancelAnimation() {
		cancelAnim?.();
		cancelAnim = null;
		isAnimating = false;
	}

	function animateValue(
		from: number,
		to: number,
		velocity: number,
		onUpdate: (value: number) => void,
		onComplete?: () => void
	) {
		cancelAnimation();
		isAnimating = true;
		cancelAnim = animateCarouselValue({
			from,
			to,
			velocity,
			onUpdate,
			onComplete: () => {
				cancelAnim = null;
				isAnimating = false;
				onComplete?.();
			},
			shouldCancel: () => isDragging
		});
	}

	function startAnimation(velocity = 0) {
		const delta = scrollAnimationDelta(scrollIndex, index, count);
		const targetScroll = scrollIndex + delta;

		if (Math.abs(delta) < 0.001) {
			scrollIndex = index;
			return;
		}

		animateValue(scrollIndex, targetScroll, velocity, (value) => {
			scrollIndex = value;
		}, () => {
			scrollIndex = index;
		});
	}

	function resolveTargetIndex(intent: SwipeIntent): number {
		if (intent === 'next') return modIndex(index + 1, count);
		if (intent === 'prev') return modIndex(index - 1, count);
		return index;
	}

	function goToIndex(newIndex: number, velocity = 0, animate = true) {
		const target = modIndex(newIndex, count);

		if (animate) {
			cancelAnimation();
			isAnimating = true;
		}

		index = target;

		if (!animate) {
			cancelAnimation();
			scrollIndex = target;
			return;
		}

		startAnimation(velocity);
	}

	function snapBackY(velocity = 0) {
		animateValue(dragY, 0, velocity, (value) => {
			dragY = value;
		});
	}

	function edgeZoneWidth(viewportWidth: number): number {
		if (!showEdgeNav || viewportWidth <= 0) return 0;
		if (viewportWidth < MOBILE_EDGE_BREAKPOINT) return viewportWidth / 3;
		return leftStrip?.offsetWidth ?? 0;
	}

	function edgeTapZone(clientX: number): 'prev' | 'next' | null {
		if (!showEdgeNav || !viewport) return null;

		const rect = viewport.getBoundingClientRect();
		const zone = edgeZoneWidth(rect.width);
		if (zone <= 0) return null;

		const x = clientX - rect.left;
		if (x < zone) return 'prev';
		if (x > rect.width - zone) return 'next';
		return null;
	}

	function updateEdgeHover(event: PointerEvent) {
		if (!showEdgeNav || event.pointerType !== 'mouse' || isDragging) {
			hoveredEdge = null;
			return;
		}

		const width = viewport?.getBoundingClientRect().width ?? 0;
		hoveredEdge = width >= MOBILE_EDGE_BREAKPOINT ? edgeTapZone(event.clientX) : null;
	}

	function clearEdgeHover() {
		hoveredEdge = null;
	}

	function handleTap(event: PointerEvent) {
		const edge = edgeTapZone(event.clientX);
		if (edge === 'prev') {
			goToIndex(modIndex(index - 1, count), 0, false);
			return;
		}
		if (edge === 'next') {
			goToIndex(modIndex(index + 1, count), 0, false);
			return;
		}
		if (ontap) {
			event.preventDefault();
			ontap(event);
		}
	}

	function resolveDismissIntent(dy: number, velocityY: number): boolean {
		return (
			resolveSwipeIntent({
				displacement: -dy,
				velocity: -velocityY,
				width: height
			}) === 'next'
		);
	}

	function handlePointerDown(event: PointerEvent) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		if (isVideoControlInteraction(event)) return;

		clearEdgeHover();

		if (!canSwipe) {
			if (!ontap && !onswipedown) return;

			cancelAnimation();
			isDragging = true;
			dragged = false;
			axisLock = null;
			dragY = 0;
			startX = event.clientX;
			startY = event.clientY;
			ySamples = onswipedown ? [{ x: event.clientY, t: performance.now() }] : [];
			activePointerId = event.pointerId;
			viewport?.setPointerCapture(event.pointerId);
			return;
		}

		if (width <= 0) return;

		cancelAnimation();

		isDragging = true;
		dragged = false;
		axisLock = null;
		dragY = 0;
		startX = event.clientX;
		startY = event.clientY;
		startScrollIndex = scrollIndex;
		samples = [{ x: event.clientX, t: performance.now() }];
		ySamples = onswipedown ? [{ x: event.clientY, t: performance.now() }] : [];
		activePointerId = event.pointerId;
		viewport?.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		updateEdgeHover(event);
		if (!isDragging || activePointerId !== event.pointerId) return;

		const dx = event.clientX - startX;
		const dy = event.clientY - startY;

		if (!canSwipe) {
			if (
				!axisLock &&
				onswipedown &&
				(Math.abs(dx) > SWIPE_LOCK_PX || Math.abs(dy) > SWIPE_LOCK_PX)
			) {
				axisLock = 'y';
			}

			if (axisLock === 'y' && onswipedown) {
				event.preventDefault();
				pushPointerSample(ySamples, event.clientY, performance.now());
				dragY = Math.max(0, dy);
			}

			if (Math.abs(dx) > SWIPE_DRAG_PX || Math.abs(dy) > SWIPE_DRAG_PX) dragged = true;
			return;
		}

		if (!axisLock) {
			if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;
			axisLock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
		}

		if (axisLock === 'y') {
			if (!onswipedown) {
				releasePointer(event);
				resetGesture();
				startAnimation();
				return;
			}

			event.preventDefault();
			pushPointerSample(ySamples, event.clientY, performance.now());
			dragY = Math.max(0, dy);
			if (Math.abs(dy) > SWIPE_DRAG_PX) dragged = true;
			return;
		}

		event.preventDefault();
		pushPointerSample(samples, event.clientX, performance.now());
		scrollIndex = startScrollIndex - dx / width;

		if (Math.abs(dx) > SWIPE_DRAG_PX) dragged = true;
	}

	function handlePointerUp(event: PointerEvent) {
		if (!isDragging || activePointerId !== event.pointerId) return;

		releasePointer(event);

		if (axisLock === 'y' && onswipedown) {
			const dy = event.clientY - startY;
			const velocityY = getPointerVelocity(ySamples);
			if (resolveDismissIntent(dy, velocityY)) {
				dragY = 0;
				event.preventDefault();
				onswipedown();
			} else {
				snapBackY(velocityY);
				if (!dragged) handleTap(event);
			}
		} else if (canSwipe && axisLock === 'x') {
			const dx = event.clientX - startX;
			const velocity = getPointerVelocity(samples);
			const intent = resolveSwipeIntent({
				displacement: dx,
				velocity,
				width
			});
			if (intent === 'stay') {
				handleTap(event);
			} else {
				goToIndex(resolveTargetIndex(intent), velocity);
			}
		} else if (!dragged) {
			handleTap(event);
		}

		resetGesture();
	}

	function handlePointerCancel(event: PointerEvent) {
		if (activePointerId !== event.pointerId) return;
		releasePointer(event);

		if (dragY > 0) snapBackY();
		else if (canSwipe) startAnimation();

		resetGesture();
	}

	export function goNext() {
		if (!canSwipe || isDragging || width <= 0) return;
		goToIndex(modIndex(index + 1, count), 0, false);
	}

	export function goPrev() {
		if (!canSwipe || isDragging || width <= 0) return;
		goToIndex(modIndex(index - 1, count), 0, false);
	}
</script>

<div
	bind:this={viewport}
	role="presentation"
	class={['relative h-full w-full overflow-hidden', className]}
	style:touch-action={onswipedown ? 'none' : undefined}
	onpointerdown={hasPointerHandlers ? handlePointerDown : undefined}
	onpointermove={hasPointerHandlers ? handlePointerMove : undefined}
	onpointerup={hasPointerHandlers ? handlePointerUp : undefined}
	onpointercancel={hasPointerHandlers ? handlePointerCancel : undefined}
	onpointerleave={showEdgeNav ? clearEdgeHover : undefined}
>
	{#if isLightboxEdge}
		<div class={[lightboxEdgeCurtain, 'left-0', edgeStripWidth]} aria-hidden="true"></div>
		<div class={[lightboxEdgeCurtain, 'right-0', edgeStripWidth]} aria-hidden="true"></div>
	{/if}

	{#if showEdgeNav}
		<div
			bind:this={leftStrip}
			class={[
				'pointer-events-none absolute inset-y-0 left-0 z-20 grid place-items-center',
				edgeStripWidth,
				stripClass,
				hoveredEdge === 'prev' ? stripHoverClass : ''
			]}
			aria-hidden="true"
		>
			<svg
				class="size-8 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M15 6l-6 6 6 6" />
			</svg>
		</div>
		<div
			class={[
				'pointer-events-none absolute inset-y-0 right-0 z-20 grid place-items-center',
				edgeStripWidth,
				stripClass,
				hoveredEdge === 'next' ? stripHoverClass : ''
			]}
			aria-hidden="true"
		>
			<svg
				class="size-8 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M9 6l6 6-6 6" />
			</svg>
		</div>
	{/if}

	<div
		bind:this={trackArea}
		class={[
			'h-full w-full',
			canSwipe && !onswipedown ? 'touch-pan-y' : '',
			isLightboxEdge ? carouselEdgeInset : ''
		]}
		style:touch-action={onswipedown ? 'none' : undefined}
	>
		{#if canSwipe}
			<div class="h-full" style:transform="translate3d(0, {dragY}px, 0)">
				<div
					bind:this={track}
					role="presentation"
					class={[
						'flex h-full cursor-grab select-none active:cursor-grabbing',
						isDragging ? 'cursor-grabbing' : '',
						isDragging || isAnimating ? 'will-change-transform' : ''
					]}
					style:transform="translate3d({translateX}px, 0, 0)"
					style:width="{width * 3}px"
					style:touch-action={trackTouchAction}
				>
					<!-- Slides keyed by unwrapped track position: their DOM survives anchor shifts, since recycling slots would swap video src and reset playback. -->
					{#each renderPositions as pos (pos)}
						<div
							class="h-full shrink-0"
							style:width="{width}px"
							aria-hidden={pos !== renderAnchor ? 'true' : undefined}
						>
							{@render slide(modIndex(pos, count))}
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div
				role="presentation"
				class="h-full w-full"
				style:transform="translate3d(0, {dragY}px, 0)"
			>
				{@render slide(index)}
			</div>
		{/if}
	</div>
</div>
