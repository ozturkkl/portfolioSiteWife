<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { navLinks, site } from '$lib/data/site';

	let menuOpen = $state(false);
	let heroVisible = $state(true);

	const pathname = $derived(page.url.pathname);
	const isHome = $derived(pathname === resolve('/'));
	const useLightHeader = $derived(isHome && heroVisible && !menuOpen);

	function closeMenu() {
		menuOpen = false;
	}

	function isActive(href: (typeof navLinks)[number]['href']) {
		return pathname === resolve(href);
	}

	function navLinkClass(href: (typeof navLinks)[number]['href']) {
		const active = isActive(href);
		if (useLightHeader) {
			return active ? 'text-white' : 'text-white/85 hover:text-white';
		}
		return active ? 'text-accent' : 'text-ink-muted hover:text-accent';
	}

	$effect(() => {
		pathname;
		menuOpen = false;
	});

	$effect(() => {
		if (!isHome) {
			heroVisible = false;
			return;
		}

		heroVisible = true;
		const hero = document.getElementById('hero');
		if (!hero) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				heroVisible = entry.isIntersecting;
			},
			{ threshold: 0.15 }
		);

		observer.observe(hero);
		return () => observer.disconnect();
	});
</script>

<header class="fixed inset-x-0 top-0 z-50">
	<div
		class={[
			'transition-colors duration-300',
			useLightHeader
				? 'border-transparent bg-transparent'
				: 'border-b border-cream-dark/30 bg-cream/90 backdrop-blur-md'
		]}
	>
		<div
			class="site-gutter flex min-h-14 items-center justify-between gap-4 py-2 md:min-h-16 md:items-baseline md:py-2.5"
		>
			<a
				href={resolve('/')}
				class={[
					'nav-link -ml-3 shrink-0 whitespace-nowrap font-serif tracking-[0.08em] lowercase',
					useLightHeader ? 'text-2xl text-white lg:text-3xl' : 'text-2xl text-ink lg:text-3xl'
				]}
			>
				{site.brandName}
			</a>

			<nav class="hidden items-baseline md:flex" aria-label="Main navigation">
				{#each navLinks as link (link.href)}
					<a
						href={resolve(link.href)}
						class={['nav-link text-nav', navLinkClass(link.href)]}
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<button
				type="button"
				class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center md:hidden"
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<div class="flex w-5 flex-col gap-1.5" aria-hidden="true">
					<span
						class={[
							'block h-px w-full transition-transform duration-300',
							useLightHeader ? 'bg-white' : 'bg-ink',
							menuOpen && 'translate-y-[7px] rotate-45'
						]}
					></span>
					<span
						class={[
							'block h-px w-full transition-opacity duration-300',
							useLightHeader ? 'bg-white' : 'bg-ink',
							menuOpen && 'opacity-0'
						]}
					></span>
					<span
						class={[
							'block h-px w-full transition-transform duration-300',
							useLightHeader ? 'bg-white' : 'bg-ink',
							menuOpen && '-translate-y-[7px] -rotate-45'
						]}
					></span>
				</div>
			</button>
		</div>
	</div>

	{#if menuOpen}
		<nav
			class={[
				'border-b pb-4 backdrop-blur-md md:hidden',
				useLightHeader
					? 'border-white/20 bg-black/80'
					: 'border-cream-dark bg-cream/98'
			]}
			aria-label="Mobile navigation"
		>
			<ul
				class={[
					'divide-y',
					useLightHeader ? 'divide-white/20' : 'divide-cream-dark'
				]}
			>
				{#each navLinks as link (link.href)}
					<li>
						<a
							href={resolve(link.href)}
							class={['nav-link-mobile site-gutter text-nav-mobile', navLinkClass(link.href)]}
							aria-current={isActive(link.href) ? 'page' : undefined}
							onclick={closeMenu}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</header>
