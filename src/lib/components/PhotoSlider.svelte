<script lang="ts">
	import CarouselEdgeButton from '$lib/components/CarouselEdgeButton.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import MediaThumb from '$lib/components/MediaThumb.svelte';
	import SwipeCarousel from '$lib/components/SwipeCarousel.svelte';
	import { carouselEdgeInset } from '$lib/utils/carousel-edge';
	import type { MediaAsset } from '$lib/types/media';
	import { isVideo } from '$lib/types/media';

	let {
		assets,
		class: className = '',
		onOpenLightbox
	}: {
		assets: MediaAsset[];
		class?: string;
		onOpenLightbox?: (index: number) => void;
	} = $props();

	let index = $state(0);
	let lightboxOpen = $state(false);
	let carousel = $state<SwipeCarousel | null>(null);

	const current = $derived(assets[index] ?? assets[0]);

	function prev() {
		carousel?.goPrev();
	}

	function next() {
		carousel?.goNext();
	}

	function openLightbox() {
		if (onOpenLightbox) {
			onOpenLightbox(index);
			return;
		}
		lightboxOpen = true;
	}

	function viewLabel(asset: MediaAsset): string {
		return isVideo(asset) ? `Play video: ${asset.alt}` : `View full size: ${asset.alt}`;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (assets.length <= 1) return;

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			prev();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			next();
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openLightbox();
		}
	}
</script>

{#snippet slide(assetIndex: number)}
	{@const asset = assets[assetIndex]}
	<div
		class={[
			'flex h-full w-full items-center justify-center',
			carouselEdgeInset,
			isVideo(asset) ? 'cursor-pointer' : 'cursor-zoom-in'
		]}
	>
		<MediaThumb asset={asset} fit="contain" class="h-full w-full" />
	</div>
{/snippet}

{#if assets.length > 0}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class={[
			'relative rounded-site focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
			className
		]}
		role={assets.length > 1 ? 'group' : undefined}
		aria-label={assets.length > 1 ? `Photo slider, slide ${index + 1} of ${assets.length}` : undefined}
		tabindex={assets.length > 1 ? 0 : undefined}
		onkeydown={assets.length > 1 ? handleKeydown : undefined}
	>
		<div class="photo-frame relative aspect-3/2 overflow-hidden bg-cream-dark">
			{#if assets.length > 1}
				<SwipeCarousel
					bind:this={carousel}
					count={assets.length}
					bind:index
					{slide}
					ontap={openLightbox}
					class="h-full"
				/>
				<CarouselEdgeButton direction="prev" onclick={prev} />
				<CarouselEdgeButton direction="next" onclick={next} />
			{:else}
				<button
					type="button"
					class={[
						'flex h-full w-full items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
						isVideo(current) ? 'cursor-pointer' : 'cursor-zoom-in'
					]}
					onclick={openLightbox}
					aria-label={viewLabel(current)}
				>
					<MediaThumb asset={current} fit="contain" class="h-full w-full" />
				</button>
			{/if}
		</div>

		{#if assets.length > 1}
			<p class="text-caption mt-3 text-center text-ink-muted">
				{index + 1} / {assets.length}
			</p>
		{/if}
	</div>
{/if}

{#if !onOpenLightbox}
	<Lightbox
		assets={lightboxOpen ? assets : []}
		openingIndex={index}
		bind:index
		onclose={() => (lightboxOpen = false)}
	/>
{/if}
