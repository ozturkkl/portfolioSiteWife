<script lang="ts">
	import CoupleSection from '$lib/components/CoupleSection.svelte';
	import GalleryGrid from '$lib/components/GalleryGrid.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageContainer from '$lib/components/ui/PageContainer.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import { media } from '$lib/data/media';
	import { pageTitle } from '$lib/data/site';

	const categories = media.portfolio.categories;
	const defaultCategory = categories[0] ?? '';

	const couplesCategory = $derived.by(() => {
		for (const section of media.portfolio.couples) {
			const category = section.media[0]?.category;
			if (category) return category;
		}
		return undefined;
	});

	let activeCategory = $state(defaultCategory);
	let filterGroup = $state<HTMLDivElement | null>(null);

	const filteredGalleryMedia = $derived(
		media.portfolio.media.filter((item) => item.category === activeCategory)
	);

	const showCoupleSections = $derived(
		couplesCategory !== undefined && activeCategory === couplesCategory
	);

	function selectCategory(category: string) {
		activeCategory = category;
	}

	function handleFilterKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

		const buttons = filterGroup?.querySelectorAll('button');
		if (!buttons?.length) return;

		const focusedIndex = [...buttons].findIndex((button) => button === document.activeElement);
		if (focusedIndex === -1) return;

		event.preventDefault();
		const delta = event.key === 'ArrowRight' ? 1 : -1;
		const nextIndex = (focusedIndex + delta + buttons.length) % buttons.length;
		const nextCategory = categories[nextIndex];

		if (!nextCategory) return;

		selectCategory(nextCategory);
		(buttons[nextIndex] as HTMLButtonElement).focus();
	}
</script>

<svelte:head>
	<title>{pageTitle('Portfolio')}</title>
</svelte:head>

<PageContainer>
	<SectionHeading
		title="A collection of stories"
		subtitle="Each image is a moment preserved — raw, honest, and full of feeling."
	/>

	<div
		bind:this={filterGroup}
		class="mb-12 flex flex-wrap justify-center gap-4"
		role="toolbar"
		aria-label="Filter gallery by category"
	>
		{#each categories as category (category)}
			<Button
				variant="tab"
				type="button"
				active={activeCategory === category}
				aria-pressed={activeCategory === category}
				onclick={() => selectCategory(category)}
				onkeydown={handleFilterKeydown}
			>
				{category}
			</Button>
		{/each}
	</div>

	{#if showCoupleSections}
		{#each media.portfolio.couples as couple (couple.id)}
			<CoupleSection {couple} />
		{/each}
	{:else}
		<GalleryGrid assets={filteredGalleryMedia} lightbox />
	{/if}
</PageContainer>
