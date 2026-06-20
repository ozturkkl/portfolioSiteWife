<script lang="ts">
	import { resolve } from '$app/paths';
	import IconEmail from '$lib/components/ui/IconEmail.svelte';
	import IconInstagram from '$lib/components/ui/IconInstagram.svelte';
	import { navLinks, site } from '$lib/data/site';
</script>

<footer class="site-gutter border-t border-cream-dark bg-cream-dark/30 py-10 md:py-14">
	<div
		class="flex w-full flex-col items-center gap-8 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left"
	>
		<div class="max-w-md">
			<p class="text-body leading-snug">{site.footer.note}</p>
			<p class="mt-2 font-serif text-base tracking-[0.08em] text-ink-muted lowercase">
				© {site.brandName}
			</p>
		</div>

		<nav aria-label="Footer navigation">
			<ul class="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:gap-x-6 lg:justify-start">
				{#each navLinks as link (link.href)}
					<li>
						<a href={resolve(link.href)} class="text-body link">
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="flex flex-col items-center gap-2 lg:items-end">
			<a
				href={site.contact.instagramUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="group link flex items-center gap-3 lg:justify-end"
			>
				<span class="text-base text-ink-muted transition-colors group-hover:text-accent lg:text-right">
					{site.contact.instagram}
				</span>
				<IconInstagram />
			</a>
			<a href="mailto:{site.contact.email}" class="group link flex items-center gap-3 lg:justify-end">
				<span class="text-base text-ink-muted transition-colors group-hover:text-accent lg:text-right">
					{site.contact.email}
				</span>
				<IconEmail />
			</a>
		</div>
	</div>
</footer>
