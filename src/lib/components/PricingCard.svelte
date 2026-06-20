<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/Button.svelte';
	import type { PricingPackage } from '$lib/data/pricing';

	let {
		pkg,
		active = false
	}: {
		pkg: PricingPackage;
		active?: boolean;
	} = $props();
</script>

<article
	class={[
		'rounded-site flex h-full flex-col border p-8 transition-[border-color,box-shadow,opacity,transform] duration-300 md:p-10',
		active ? 'border-accent bg-white shadow-md' : 'border-ink/20 bg-cream/50'
	]}
>
	<h3 class="heading-card">{pkg.name}</h3>
	<p class="text-price mt-2">{pkg.price}</p>
	<p class="text-body-muted mt-4 text-base">{pkg.description}</p>

	<ul class="mt-8 flex-1 space-y-3">
		{#each pkg.features as feature (feature)}
			<li class="text-body-muted flex items-start gap-3 text-base">
				<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent"></span>
				{feature}
			</li>
		{/each}
	</ul>

	<Button href={resolve('/contact')} block class="mt-10">Inquire</Button>
</article>
