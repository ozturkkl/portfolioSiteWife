<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/Button.svelte';
	import PageContainer from '$lib/components/ui/PageContainer.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import { media } from '$lib/data/media';
	import { pageTitle, site } from '$lib/data/site';
	import { staticSrc } from '$lib/utils/static-src';
</script>

<svelte:head>
	<title>{pageTitle('About')}</title>
</svelte:head>

<PageContainer>
	<SectionHeading title={site.about.greeting} />

	<div class="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
		<div class="photo-frame mx-auto w-full max-w-72 sm:max-w-80 lg:mx-0 lg:max-w-none">
			<img
				src={staticSrc(media.about.src)}
				alt={media.about.alt}
				width={media.about.width}
				height={media.about.height}
				class="aspect-3/4 w-full object-cover"
				loading="eager"
			/>
		</div>

		<div>
			<div class="text-body-muted space-y-4">
				<p>{site.about.intro}</p>
				{#each site.about.paragraphs as paragraph, i (i)}
					<p>{paragraph}</p>
				{/each}
			</div>

			<blockquote class="mt-8 border-l-2 border-accent pl-6">
				<p class="eyebrow">{site.about.philosophy.eyebrow}</p>
				<p class="heading-quote mt-3">{site.about.philosophy.quote}</p>
			</blockquote>

			<Button href={resolve('/contact')} class="mt-8">Get in touch</Button>
		</div>
	</div>
</PageContainer>
