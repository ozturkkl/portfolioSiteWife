<script lang="ts">
	import { resolve } from '$app/paths';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import { media } from '$lib/data/media';
	import { site } from '$lib/data/site';
	import { staticSrc } from '$lib/utils/static-src';
</script>

<svelte:head>
	<title>About — {site.name}</title>
</svelte:head>

<section class="page-section">
	<div class="container-wide">
		<SectionHeading eyebrow="About me" title="Meet the artist behind the lens" />

		<div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
			<div class="photo-frame">
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
				<h3 class="heading-section">{site.about.greeting}</h3>
				<div class="text-body-muted mt-6 space-y-4">
					<p>{site.about.intro}</p>
					{#each site.about.paragraphs as paragraph, i (i)}
						<p>{paragraph}</p>
					{/each}
				</div>

				<blockquote class="mt-10 border-l-2 border-accent pl-6">
					<p class="eyebrow">{site.about.philosophy.eyebrow}</p>
					<p class="heading-quote mt-3">{site.about.philosophy.quote}</p>
				</blockquote>

				<a href={resolve('/contact')} class="btn-primary mt-10">Get in touch</a>
			</div>
		</div>
	</div>
</section>
