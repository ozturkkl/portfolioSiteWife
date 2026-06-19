<script lang="ts">
	import GalleryGrid from '$lib/components/GalleryGrid.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import PhotoSlider from '$lib/components/PhotoSlider.svelte';
	import type { CoupleSection, MediaAsset } from '$lib/types/media';

	let { couple }: { couple: CoupleSection } = $props();

	const hasSlider = $derived((couple.slider?.length ?? 0) > 0);
	const allAssets = $derived<MediaAsset[]>([
		...couple.media,
		...(couple.slider ?? [])
	]);

	let lightboxIndex = $state<number | null>(null);

	function openLightbox(index: number) {
		lightboxIndex = index;
	}
</script>

<section class="mb-20 last:mb-0">
	<h2 class="heading-section mb-8 text-center">{couple.label}</h2>

	{#if couple.media.length > 0}
		<GalleryGrid
			assets={couple.media}
			lightbox={!hasSlider}
			onOpenLightbox={hasSlider ? openLightbox : undefined}
		/>
	{/if}

	{#if hasSlider}
		<PhotoSlider
			assets={couple.slider!}
			onOpenLightbox={(index) => openLightbox(couple.media.length + index)}
			class={couple.media.length > 0 ? 'mt-4 sm:mt-5' : ''}
		/>
	{/if}
</section>

{#if hasSlider}
	<Lightbox
		assets={lightboxIndex !== null ? allAssets : []}
		index={lightboxIndex ?? 0}
		onclose={() => (lightboxIndex = null)}
	/>
{/if}
