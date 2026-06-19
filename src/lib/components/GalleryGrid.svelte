<script lang="ts">
	import Lightbox from '$lib/components/Lightbox.svelte';
	import MediaThumb from '$lib/components/MediaThumb.svelte';
	import type { GalleryMedia, MediaAsset } from '$lib/types/media';
	import { isVideo } from '$lib/types/media';

	const ROW_UNIT = 8;
	const FALLBACK_COL_WIDTH = 360;

	let {
		assets,
		lightbox = false,
		onOpenLightbox
	}: {
		assets: Array<GalleryMedia | MediaAsset>;
		lightbox?: boolean;
		onOpenLightbox?: (index: number) => void;
	} = $props();

	let gridEl = $state<HTMLElement | null>(null);
	let columnWidth = $state(0);
	let gap = $state(16);
	let activeIndex = $state<number | null>(null);

	function measureGrid() {
		if (!gridEl) return;

		const style = getComputedStyle(gridEl);
		const widths = style.gridTemplateColumns
			.split(/\s+/)
			.map((value) => Number.parseFloat(value))
			.filter((value) => value > 0);

		columnWidth = widths[0] ?? gridEl.clientWidth;
		gap = Number.parseFloat(style.rowGap) || 16;
	}

	function assetKey(item: GalleryMedia | MediaAsset, index: number): string {
		return 'id' in item ? item.id : `${item.src}-${index}`;
	}

	function rowSpan(item: GalleryMedia | MediaAsset): number {
		const { width, height } = item;
		if (width <= 0 || height <= 0) return 1;

		const col = columnWidth > 0 ? columnWidth : FALLBACK_COL_WIDTH;
		const displayHeight = (height / width) * col;
		return Math.max(1, Math.ceil((displayHeight + gap) / (ROW_UNIT + gap)));
	}

	function openLightbox(index: number) {
		if (onOpenLightbox) {
			onOpenLightbox(index);
			return;
		}
		if (!lightbox) return;
		activeIndex = index;
	}

	function viewLabel(item: GalleryMedia | MediaAsset): string {
		return isVideo(item) ? `Play video: ${item.alt}` : `View full size: ${item.alt}`;
	}

	$effect(() => {
		if (!gridEl) return;

		const update = () => measureGrid();

		update();
		const observer = new ResizeObserver(update);
		observer.observe(gridEl);

		return () => observer.disconnect();
	});
</script>

<div
	bind:this={gridEl}
	class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
	style:grid-auto-rows="{ROW_UNIT}px"
>
	{#each assets as item, index (assetKey(item, index))}
		<figure
			class="photo-frame group relative min-h-0"
			style:grid-row-end="span {rowSpan(item)}"
		>
			{#if lightbox || onOpenLightbox}
				<button
					type="button"
					class={[
						'block h-full w-full text-left',
						isVideo(item) ? 'cursor-pointer' : 'cursor-zoom-in'
					]}
					onclick={() => openLightbox(index)}
					aria-label={viewLabel(item)}
				>
					<MediaThumb
						asset={item}
						class="h-full transition-transform duration-700 group-hover:scale-105"
					/>
				</button>
			{:else}
				<MediaThumb
					asset={item}
					class="h-full transition-transform duration-700 group-hover:scale-105"
				/>
			{/if}
			{#if item.caption}
				<figcaption
					class="pointer-events-none absolute inset-0 flex w-full items-end bg-linear-to-t from-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				>
					<span class="w-full min-w-0 truncate text-base font-medium text-white md:text-lg">
						{item.caption}
					</span>
				</figcaption>
			{/if}
		</figure>
	{/each}
</div>

{#if lightbox && !onOpenLightbox}
	<Lightbox
		assets={activeIndex !== null ? (assets as MediaAsset[]) : []}
		index={activeIndex ?? 0}
		onclose={() => (activeIndex = null)}
	/>
{/if}
