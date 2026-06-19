<script lang="ts">
	import Lightbox from '$lib/components/Lightbox.svelte';
	import MediaThumb from '$lib/components/MediaThumb.svelte';
	import type { MediaAsset } from '$lib/types/media';
	import { isVideo } from '$lib/types/media';

	let {
		assets,
		class: className = ''
	}: {
		assets: MediaAsset[];
		class?: string;
	} = $props();

	let index = $state(0);
	let activeAsset = $state<MediaAsset | null>(null);

	const current = $derived(assets[index] ?? assets[0]);

	function prev() {
		index = (index - 1 + assets.length) % assets.length;
	}

	function next() {
		index = (index + 1) % assets.length;
	}

	function openLightbox() {
		if (current) activeAsset = current;
	}

	function viewLabel(asset: MediaAsset): string {
		return isVideo(asset) ? `Play video: ${asset.alt}` : `View full size: ${asset.alt}`;
	}
</script>

{#if assets.length > 0}
	<div class={['relative', className]}>
		<div class="photo-frame aspect-3/2 overflow-hidden bg-cream-dark">
			<button
				type="button"
				class={[
					'flex h-full w-full items-center justify-center',
					isVideo(current) ? 'cursor-pointer' : 'cursor-zoom-in'
				]}
				onclick={openLightbox}
				aria-label={viewLabel(current)}
			>
				<MediaThumb asset={current} fit="contain" class="h-full w-full" />
			</button>
		</div>

		{#if assets.length > 1}
			<button
				type="button"
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
				class="absolute top-1/2 right-3 z-10 -translate-y-1/2 rounded-site bg-black/40 px-2 py-3 text-2xl leading-none text-white transition-colors hover:bg-black/60"
				aria-label="Next slide"
				onclick={(event) => {
					event.stopPropagation();
					next();
				}}
			>
				›
			</button>
			<p class="text-caption mt-3 text-center text-ink-muted">
				{index + 1} / {assets.length}
			</p>
		{/if}
	</div>
{/if}

<Lightbox asset={activeAsset} onclose={() => (activeAsset = null)} />
