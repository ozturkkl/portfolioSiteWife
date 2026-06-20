<script lang="ts">
	import Portrait from '$lib/components/ui/Portrait.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import PageContainer from '$lib/components/ui/PageContainer.svelte';
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import { media } from '$lib/data/media';
	import { pageTitle, site } from '$lib/data/site';

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let submitted = $state(false);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;
	}
</script>

<svelte:head>
	<title>{pageTitle('Contact')}</title>
</svelte:head>

<PageContainer width="narrow">
	<SectionHeading
		title="Book your date"
		subtitle="I'd love to hear about your vision. Fill out the form below and I'll get back to you within 48 hours."
	/>

	{#if submitted}
		<div class="text-center">
			<p class="heading-card">Thank you for reaching out!</p>
			<p class="text-body-muted mt-4">
				I'll be in touch soon. In the meantime, feel free to follow along on Instagram.
			</p>
			<a
				href={site.contact.instagramUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="text-nav mt-8 inline-block text-accent hover:text-ink"
			>
				{site.contact.instagram}
			</a>
		</div>
	{:else}
		<div class="grid gap-10 lg:grid-cols-2 lg:gap-16">
			<form class="space-y-6" onsubmit={handleSubmit}>
				<div>
					<label for="name" class="label">Name</label>
					<input id="name" type="text" bind:value={name} required class="input" />
				</div>

				<div>
					<label for="email" class="label">Email</label>
					<input id="email" type="email" bind:value={email} required class="input" />
				</div>

				<div>
					<label for="message" class="label">Message</label>
					<textarea
						id="message"
						bind:value={message}
						required
						rows={6}
						class="input resize-none"
						placeholder="Tell me about your session, preferred dates, and any ideas you have in mind..."
					></textarea>
				</div>

				<Button type="submit" block>Send message</Button>
			</form>

			<div class="flex flex-col items-center gap-8 lg:items-start">
				<div>
					<p class="text-caption">Email</p>
					<a href="mailto:{site.contact.email}" class="text-contact">
						{site.contact.email}
					</a>
				</div>

				<div>
					<p class="text-caption">Instagram</p>
					<a
						href={site.contact.instagramUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="text-contact"
					>
						{site.contact.instagram}
					</a>
				</div>

				<Portrait asset={media.contact} />
			</div>
		</div>
	{/if}
</PageContainer>
