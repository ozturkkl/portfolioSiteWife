<script lang="ts">
	import Portrait from '$lib/components/ui/Portrait.svelte';
	import type { MediaAsset } from '$lib/types/media';
	import { site } from '$lib/data/site';

	let { asset }: { asset: MediaAsset } = $props();
</script>

<section class="bg-cream section-padding">
	<div class="container-narrow">
		<div
			class="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-12 lg:gap-16"
		>
			<Portrait {asset} class="mx-auto md:mx-0" />
			<div class="max-w-xl md:max-w-none">
				<h2 class="heading-section">{site.about.greeting}</h2>
				<p class="text-lead mt-6">
					{site.about.intro}
				</p>
			</div>
		</div>
	</div>
</section>
