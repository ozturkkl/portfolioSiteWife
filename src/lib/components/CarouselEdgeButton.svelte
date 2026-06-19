<script lang="ts">
	import {
		frameStripWidth,
		lightboxEdgeChrome,
		mediaEdgeChrome,
		viewportStripWidth
	} from '$lib/utils/carousel-edge';

	let {
		direction,
		variant = 'media',
		scope = 'frame',
		onclick
	}: {
		direction: 'prev' | 'next';
		variant?: 'media' | 'lightbox';
		scope?: 'frame' | 'viewport';
		onclick: (event: MouseEvent) => void;
	} = $props();

	const isPrev = $derived(direction === 'prev');
	const stripWidth = $derived(scope === 'viewport' ? viewportStripWidth : frameStripWidth);
	const stripClass = $derived(variant === 'lightbox' ? lightboxEdgeChrome : mediaEdgeChrome);
</script>

<button
	type="button"
	tabindex={-1}
	class={[
		'absolute inset-y-0 z-20 hidden grid place-items-center sm:grid',
		stripWidth,
		stripClass,
		isPrev ? 'left-0' : 'right-0'
	]}
	aria-label={isPrev ? 'Previous slide' : 'Next slide'}
	{onclick}
>
	<svg
		class="size-8 shrink-0"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{#if isPrev}
			<path d="M15 6l-6 6 6 6" />
		{:else}
			<path d="M9 6l6 6-6 6" />
		{/if}
	</svg>
</button>
