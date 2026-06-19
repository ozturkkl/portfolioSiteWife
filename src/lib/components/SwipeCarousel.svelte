<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onDestroy } from 'svelte';
	import {
		easeOutCubic,
		getPointerVelocity,
		modIndex,
		pushPointerSample,
		resolveSwipeIntent,
		scrollFraction,
		scrollAnimationDelta,
		SWIPE_DRAG_PX,
		SWIPE_LOCK_PX,
		swipeDurationMs,
		type PointerSample,
		type SwipeIntent
	} from '$lib/utils/swipe-carousel';

	let {
		count,
		index = $bindable(0),
		slide,
		ontap,
		class: className = '',
		disabled = false
	}: {
		count: number;
		index?: number;
		slide: Snippet<[number]>;
		ontap?: () => void;
		class?: string;
		disabled?: boolean;
	} = $props();

	let viewport = $state<HTMLDivElement | null>(null);
	let track = $state<HTMLDivElement | null>(null);
	let width = $state(0);
	let scrollIndex = $state(0);
	let isDragging = $state(false);
	let isAnimating = $state(false);

	let startX = 0;
	let startY = 0;
	let startScrollIndex = 0;
	let axisLock: 'x' | 'y' | null = null;
	let dragged = false;
	let samples: PointerSample[] = [];
	let activePointerId: number | null = null;
	let animFrame: number | null = null;

	const canSwipe = $derived(count > 1 && !disabled);
	const renderAnchor = $derived(modIndex(Math.floor(scrollIndex), count));
	const renderOffset = $derived(-scrollFraction(scrollIndex) * width);
	const prevIndex = $derived(modIndex(renderAnchor - 1, count));
	const centerIndex = $derived(modIndex(renderAnchor, count));
	const nextIndex = $derived(modIndex(renderAnchor + 1, count));
	const translateX = $derived(canSwipe ? -width + renderOffset : 0);

	$effect(() => {
		if (!viewport) return;

		const observer = new ResizeObserver(([entry]) => {
			width = entry.contentRect.width;
		});
		observer.observe(viewport);
		width = viewport.clientWidth;

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
	}

	function releasePointer(event: PointerEvent) {
		if (activePointerId !== event.pointerId || !track) return;
		track.releasePointerCapture(event.pointerId);
		activePointerId = null;
	}

	function cancelAnimation() {
		if (animFrame !== null) {
			cancelAnimationFrame(animFrame);
			animFrame = null;
		}
		isAnimating = false;
	}

	function startAnimation(velocity = 0) {
		cancelAnimation();

		const delta = scrollAnimationDelta(scrollIndex, index, count);
		const targetScroll = scrollIndex + delta;

		if (Math.abs(delta) < 0.001) {
			scrollIndex = index;
			return;
		}

		isAnimating = true;
		const startScroll = scrollIndex;
		const duration = swipeDurationMs(Math.abs(delta) * width, velocity);
		const startTime = performance.now();

		function step(now: number) {
			if (isDragging) {
				cancelAnimation();
				return;
			}

			const t = Math.min(1, (now - startTime) / duration);
			scrollIndex = startScroll + (targetScroll - startScroll) * easeOutCubic(t);

			if (t < 1) {
				animFrame = requestAnimationFrame(step);
				return;
			}

			scrollIndex = index;
			cancelAnimation();
		}

		animFrame = requestAnimationFrame(step);
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

	function handlePointerDown(event: PointerEvent) {
		if (!canSwipe || width <= 0) return;
		if (event.pointerType === 'mouse' && event.button !== 0) return;

		cancelAnimation();

		isDragging = true;
		dragged = false;
		axisLock = null;
		startX = event.clientX;
		startY = event.clientY;
		startScrollIndex = scrollIndex;
		samples = [{ x: event.clientX, t: performance.now() }];
		activePointerId = event.pointerId;
		track?.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging || activePointerId !== event.pointerId) return;

		const dx = event.clientX - startX;
		const dy = event.clientY - startY;

		if (!axisLock) {
			if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;
			axisLock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
		}

		if (axisLock === 'y') {
			releasePointer(event);
			resetGesture();
			startAnimation();
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

		if (axisLock === 'x') {
			const dx = event.clientX - startX;
			const velocity = getPointerVelocity(samples);
			const intent = resolveSwipeIntent({
				displacement: dx,
				velocity,
				width
			});
			goToIndex(resolveTargetIndex(intent), velocity);
		} else if (!dragged) {
			ontap?.();
		}

		resetGesture();
	}

	function handlePointerCancel(event: PointerEvent) {
		if (activePointerId !== event.pointerId) return;
		releasePointer(event);
		resetGesture();
		startAnimation();
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
	class={['h-full w-full overflow-hidden', canSwipe ? 'touch-pan-y' : '', className]}
>
	{#if canSwipe}
		<div
			bind:this={track}
			role="presentation"
			class={[
				'flex h-full cursor-grab select-none active:cursor-grabbing',
				isDragging ? 'cursor-grabbing' : ''
			]}
			style:transform="translate3d({translateX}px, 0, 0)"
			style:width="{width * 3}px"
			style:touch-action="pan-y"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerCancel}
		>
			<div class="h-full shrink-0" style:width="{width}px" aria-hidden="true">
				{@render slide(prevIndex)}
			</div>
			<div class="h-full shrink-0" style:width="{width}px">
				{@render slide(centerIndex)}
			</div>
			<div class="h-full shrink-0" style:width="{width}px" aria-hidden="true">
				{@render slide(nextIndex)}
			</div>
		</div>
	{:else}
		<div class="h-full w-full">
			{@render slide(index)}
		</div>
	{/if}
</div>
