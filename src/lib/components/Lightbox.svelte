<script lang="ts">
	import ProgressiveFullImage from '$lib/components/ProgressiveFullImage.svelte';
	import SwipeCarousel from '$lib/components/SwipeCarousel.svelte';
	import type { MediaAsset } from '$lib/types/media';
	import { isVideo } from '$lib/types/media';
	import { lightboxEdgeChrome } from '$lib/utils/carousel-edge';
	import { staticSrc } from '$lib/utils/static-src';
	import { isVideoControlInteraction, modIndex } from '$lib/utils/swipe-carousel';

	let {
		assets = [],
		openingIndex = 0,
		index = $bindable(0),
		onclose
	}: {
		assets: MediaAsset[];
		openingIndex?: number;
		index?: number;
		onclose: () => void;
	} = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	let carousel = $state<SwipeCarousel | null>(null);
	let imageFailed = $state<Record<number, boolean>>({});
	let fullLoadedUrls = $state<Record<string, boolean>>({});
	let wasClosed = $state(true);

	const isOpen = $derived(assets.length > 0);
	const multiple = $derived(assets.length > 1);

	$effect(() => {
		const hasAssets = assets.length > 0;
		if (hasAssets && wasClosed) {
			index = modIndex(openingIndex, assets.length);
		}
		wasClosed = !hasAssets;
	});

	$effect(() => {
		if (!dialog) return;
		if (isOpen) {
			imageFailed = {};
			fullLoadedUrls = {};
			if (!dialog.open) {
				dialog.showModal();
				(document.activeElement as HTMLElement | null)?.blur();
			}
		} else if (dialog.open) {
			dialog.close();
		}
	});

	$effect(() => {
		if (!isOpen) {
			pauseVideos();
			return;
		}

		const html = document.documentElement;
		const prevHtmlOverflow = html.style.overflow;
		const prevBodyOverflow = document.body.style.overflow;
		html.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
		return () => {
			html.style.overflow = prevHtmlOverflow;
			document.body.style.overflow = prevBodyOverflow;
		};
	});

	$effect(() => {
		if (!isOpen) return;
		index;
		pauseVideos();
		playCurrentVideo();
	});

	function pauseVideos() {
		dialog?.querySelectorAll('video').forEach((video) => video.pause());
	}

	function playCurrentVideo() {
		if (!dialog) return;
		const video = dialog.querySelector(`[data-slide-index="${index}"] video`);
		if (video instanceof HTMLVideoElement) {
			video.play().catch(() => {});
		}
	}

	function handleDialogClose() {
		pauseVideos();
		onclose();
	}

	function close() {
		dialog?.close();
	}

	function handleCarouselTap(event: PointerEvent) {
		const target = document.elementFromPoint(event.clientX, event.clientY);
		if (target?.closest('button')) return;

		const video = target?.closest('video');
		if (video instanceof HTMLVideoElement) {
			if (isVideoControlInteraction(event)) return;
			if (video.paused) video.play().catch(() => {});
			else video.pause();
			return;
		}

		close();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialog) close();
	}

	function handleImageError(assetIndex: number) {
		imageFailed = { ...imageFailed, [assetIndex]: true };
	}

	function prev() {
		carousel?.goPrev();
	}

	function next() {
		carousel?.goNext();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen || !multiple) return;

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			prev();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			next();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<dialog
	bind:this={dialog}
	class="lightbox fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none cursor-pointer border-0 bg-black/95 p-0 backdrop:bg-black/95 outline-none"
	aria-label="Media viewer"
	onclose={handleDialogClose}
	onclick={handleBackdropClick}
>
	{#if isOpen}
		<button
			type="button"
			class={[
				'absolute top-0 right-0 z-30 grid h-20 w-20 place-items-center outline-none sm:h-24 sm:w-24',
				lightboxEdgeChrome
			]}
			aria-label="Close"
			onclick={(e) => {
				e.stopPropagation();
				close();
			}}
		>
			<svg
				class="size-8 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				aria-hidden="true"
			>
				<path d="M6 6l12 12M18 6 6 18" />
			</svg>
		</button>

		<div class={['relative h-full w-full', multiple ? '' : 'px-0 sm:px-8']} role="presentation" onkeydown={(e) => e.stopPropagation()}>
			<SwipeCarousel
				bind:this={carousel}
				count={assets.length}
				bind:index
				edgeNav={multiple}
				edgeVariant="lightbox"
				{slide}
				ontap={handleCarouselTap}
				onswipedown={close}
				class="h-full w-full"
			/>
			{#if multiple}
				<p class="text-caption pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70">
					{index + 1} / {assets.length}
				</p>
			{/if}
		</div>
	{/if}
</dialog>

{#snippet slide(assetIndex: number)}
	{@const asset = assets[assetIndex]}
	<div
		data-slide-index={assetIndex}
		class="flex h-full w-full items-center justify-center"
	>
		{#if isVideo(asset)}
			{#if imageFailed[assetIndex]}
				<img
					src={staticSrc(asset.src)}
					alt={asset.alt}
					class="max-h-full max-w-full cursor-pointer object-contain"
					decoding="async"
					draggable="false"
				/>
			{:else}
				<!-- Portfolio clips have no caption track; alt is exposed via aria-label -->
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src={asset.fullSrc}
					class="max-h-full max-w-full"
					controls
					playsinline
					preload="metadata"
					aria-label={asset.alt}
					onerror={() => handleImageError(assetIndex)}
				></video>
			{/if}
		{:else}
			<ProgressiveFullImage
				src={asset.src}
				fullSrc={asset.fullSrc}
				alt={asset.alt}
				fullFailed={imageFailed[assetIndex] ?? false}
				bind:loadedUrls={fullLoadedUrls}
				onfullerror={() => handleImageError(assetIndex)}
			/>
		{/if}
	</div>
{/snippet}

<style>
	.lightbox::backdrop {
		background: rgb(0 0 0 / 0.95);
	}
</style>
