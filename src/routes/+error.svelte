<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/Button.svelte';
	import PageContainer from '$lib/components/ui/PageContainer.svelte';
	import { pageTitle } from '$lib/data/site';

	const status = $derived(page.status);
	const message = $derived(
		status === 404 ? "The page you're looking for doesn't exist or may have moved." : 'Something went wrong.'
	);
</script>

<svelte:head>
	<title>{pageTitle(status === 404 ? 'Page not found' : 'Error')}</title>
</svelte:head>

<section class="page-section site-gutter flex flex-1 items-center">
	<PageContainer width="narrow">
		<div class="py-8 text-center md:py-12">
			<p class="eyebrow">{status}</p>
			<h1 class="heading-page mt-4">
				{status === 404 ? 'Page not found' : 'Something went wrong'}
			</h1>
			<p class="text-body-muted mx-auto mt-4 max-w-md">{message}</p>
			<div class="mt-6 md:mt-8">
				<Button href={resolve('/')} variant="ghost">Back to home</Button>
			</div>
		</div>
	</PageContainer>
</section>
