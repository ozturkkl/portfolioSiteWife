<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/Button.svelte';
	import PageContainer from '$lib/components/ui/PageContainer.svelte';
	import { pageTitle } from '$lib/data/site';
</script>

<svelte:head>
	<title>{pageTitle('Page not found')}</title>
</svelte:head>

<PageContainer width="narrow">
	<div class="py-8 text-center md:py-12">
		<h1 class="heading-page">Page not found</h1>
		<p class="text-body-muted mx-auto mt-4 max-w-md">
			The page you're looking for doesn't exist or may have moved.
		</p>
		<div class="mt-6 md:mt-8">
			<Button href={resolve('/')} variant="ghost">Back to home</Button>
		</div>
	</div>
</PageContainer>
