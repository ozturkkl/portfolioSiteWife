<script lang="ts">
	import SectionHeading from '$lib/components/ui/SectionHeading.svelte';
	import { media } from '$lib/data/media';
	import { site } from '$lib/data/site';
	import { staticSrc } from '$lib/utils/static-src';

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
	<title>Contact — {site.name}</title>
</svelte:head>

<section class="page-section">
	<div class="container-wide">
		<SectionHeading
			eyebrow="Contact me"
			title="Book your date"
			subtitle="I'd love to hear about your vision. Fill out the form below and I'll get back to you within 48 hours."
		/>

		<div class="mx-auto grid max-w-5xl gap-16 lg:grid-cols-2">
			{#if submitted}
				<div class="flex flex-col justify-center lg:col-span-2">
					<p class="heading-card text-center">Thank you for reaching out!</p>
					<p class="text-body-muted mt-4 text-center">
						I'll be in touch soon. In the meantime, feel free to follow along on Instagram.
					</p>
					<div class="mt-8 text-center">
						<a
							href={site.contact.instagramUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="text-nav text-accent hover:text-ink"
						>
							{site.contact.instagram}
						</a>
					</div>
				</div>
			{:else}
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

					<button type="submit" class="btn-primary btn-block">
						Send message
					</button>
				</form>

				<div class="flex flex-col justify-center space-y-8">
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

					<div class="photo-frame">
						<img
							src={staticSrc(media.contact.src)}
							alt={media.contact.alt}
							width={media.contact.width}
							height={media.contact.height}
							class="aspect-video w-full object-cover"
							loading="lazy"
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
