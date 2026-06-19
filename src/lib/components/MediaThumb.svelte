<script lang="ts">
	import type { MediaAsset } from '$lib/types/media';
	import { isVideo } from '$lib/types/media';
	import { staticSrc } from '$lib/utils/static-src';

	let {
		asset,
		class: className = '',
		fit = 'cover'
	}: {
		asset: MediaAsset;
		class?: string;
		fit?: 'cover' | 'contain';
	} = $props();
</script>

<div class={['relative', className]}>
	<img
		src={staticSrc(asset.src)}
		alt={asset.alt}
		width={asset.width}
		height={asset.height}
		class={['h-full w-full', fit === 'contain' ? 'object-contain' : 'object-cover']}
		loading="lazy"
		draggable="false"
	/>
	{#if isVideo(asset)}
		<div
			class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"
			aria-hidden="true"
		>
			<span
				class="flex size-12 items-center justify-center rounded-full bg-black/50 text-xl text-white sm:size-14 sm:text-2xl"
			>
				▶
			</span>
		</div>
	{/if}
</div>
