<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/Button.svelte';
	import GalleryGrid from '$lib/components/GalleryGrid.svelte';
	import type { MediaAsset } from '$lib/types/media';

	let { assets }: { assets: MediaAsset[] } = $props();
</script>

<section class="bg-cream px-6 sm:px-8">
	<GalleryGrid {assets} lightbox />

	<div class="py-12 text-center">
		<Button href={resolve('/portfolio')} variant="ghost">View portfolio</Button>
	</div>
</section>
