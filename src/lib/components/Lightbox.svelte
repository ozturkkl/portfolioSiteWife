<script lang="ts">
	import SwipeCarousel from '$lib/components/SwipeCarousel.svelte';
	import type { MediaAsset } from '$lib/types/media';
	import { isVideo } from '$lib/types/media';
	import { staticSrc } from '$lib/utils/static-src';

	let {
		assets = [],
		index = $bindable(0),
		onclose
	}: {
		assets: MediaAsset[];
		index?: number;
		onclose: () => void;
	} = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	let carousel = $state<SwipeCarousel | null>(null);
	let imageFailed = $state<Record<number, boolean>>({});

	const isOpen = $derived(assets.length > 0);
	const multiple = $derived(assets.length > 1);

	$effect(() => {
		if (!dialog) return;
		if (isOpen) {
			imageFailed = {};
			if (!dialog.open) dialog.showModal();
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

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialog) close();
	}

	function handleImageError(assetIndex: number) {
		imageFailed = { ...imageFailed, [assetIndex]: true };
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		if (event.key === 'ArrowLeft' && multiple) {
			event.preventDefault();
			carousel?.goPrev();
		} else if (event.key === 'ArrowRight' && multiple) {
			event.preventDefault();
			carousel?.goNext();
		}
	}

	function prev() {
		carousel?.goPrev();
	}

	function next() {
		carousel?.goNext();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<dialog
	bind:this={dialog}
	class="lightbox fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none cursor-zoom-out border-0 bg-black/95 p-0 backdrop:bg-black/95"
	aria-label="Media viewer"
	onclose={handleDialogClose}
	onclick={handleBackdropClick}
>
	{#if isOpen}
		<button
			type="button"
			class="absolute top-4 right-4 z-10 cursor-pointer text-3xl leading-none text-white/80 transition-colors hover:text-white"
			aria-label="Close"
			onclick={(e) => {
				e.stopPropagation();
				close();
			}}
		>
			×
		</button>

		<div
			class="relative flex h-full w-full items-center justify-center p-4 sm:p-8"
			role="presentation"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			{#if multiple}
				<SwipeCarousel
					bind:this={carousel}
					count={assets.length}
					bind:index
					{slide}
					class="h-full w-full max-h-[90vh] max-w-full"
				/>
				<button
					type="button"
					tabindex={-1}
					class="absolute top-1/2 left-3 z-10 -translate-y-1/2 rounded-site bg-black/40 px-2 py-3 text-2xl leading-none text-white transition-colors hover:bg-black/60"
					aria-label="Previous slide"
					onclick={(event) => {
						event.stopPropagation();
						prev();
					}}
				>
					‹
				</button>
				<button
					type="button"
					tabindex={-1}
					class="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-site bg-black/40 px-2 py-3 text-2xl leading-none text-white transition-colors hover:bg-black/60"
					aria-label="Next slide"
					onclick={(event) => {
						event.stopPropagation();
						next();
					}}
				>
					›
				</button>
				<p class="text-caption pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70">
					{index + 1} / {assets.length}
				</p>
			{:else}
				{@render mediaSlide(0)}
			{/if}
		</div>
	{/if}
</dialog>

{#snippet slide(assetIndex: number)}
	{@render mediaSlide(assetIndex)}
{/snippet}

{#snippet mediaSlide(assetIndex: number)}
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
					class="max-h-[90vh] max-w-full object-contain"
					decoding="async"
					draggable="false"
				/>
			{:else}
				<!-- Portfolio clips have no caption track; alt is exposed via aria-label -->
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src={asset.fullSrc}
					class="max-h-[90vh] max-w-full"
					controls
					playsinline
					preload="metadata"
					aria-label={asset.alt}
					onerror={() => handleImageError(assetIndex)}
				></video>
			{/if}
		{:else}
			<img
				src={imageFailed[assetIndex] ? staticSrc(asset.src) : asset.fullSrc}
				alt={asset.alt}
				class="max-h-[90vh] max-w-full object-contain"
				decoding="async"
				draggable="false"
				onerror={() => handleImageError(assetIndex)}
			/>
		{/if}
	</div>
{/snippet}

<style>
	.lightbox::backdrop {
		background: rgb(0 0 0 / 0.95);
	}
</style>
