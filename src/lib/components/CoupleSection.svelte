<script lang="ts">
	import GalleryGrid from '$lib/components/GalleryGrid.svelte';
	import PhotoSlider from '$lib/components/PhotoSlider.svelte';
	import type { CoupleSection } from '$lib/types/media';

	let { couple }: { couple: CoupleSection } = $props();
</script>

<section class="mb-20 last:mb-0">
	<h2 class="heading-section mb-8 text-center">{couple.label}</h2>

	{#if couple.media.length > 0}
		<GalleryGrid assets={couple.media} lightbox />
	{/if}

	{#if couple.slider?.length}
		<PhotoSlider
			assets={couple.slider}
			class={couple.media.length > 0 ? 'mt-4 sm:mt-5' : ''}
		/>
	{/if}
</section>
