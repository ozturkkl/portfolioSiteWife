<script lang="ts">
	import type { Action } from 'svelte/action';
	import { staticSrc } from '$lib/utils/static-src';

	let {
		src,
		fullSrc,
		alt,
		class: className = '',
		fullFailed = false,
		onfullerror,
		loadedUrls = $bindable({})
	}: {
		src: string;
		fullSrc: string;
		alt: string;
		class?: string;
		fullFailed?: boolean;
		onfullerror?: () => void;
		loadedUrls?: Record<string, boolean>;
	} = $props();

	let paintReady = $state(false);

	const showSpinner = $derived(!fullFailed && !paintReady);

	$effect.pre(() => {
		fullSrc;
		paintReady = false;
	});

	const fullImgAction: Action<HTMLImageElement, string> = (img, url) => {
		const markReady = () => {
			paintReady = true;
			if (!loadedUrls[url]) {
				loadedUrls = { ...loadedUrls, [url]: true };
			}
		};

		const reveal = () => {
			if (img.decode) {
				img.decode().then(markReady).catch(markReady);
				return;
			}

			markReady();
		};

		if (img.complete && img.naturalWidth > 0) {
			reveal();
			return {};
		}

		const onLoad = () => {
			img.removeEventListener('load', onLoad);
			reveal();
		};

		img.addEventListener('load', onLoad);

		return {
			destroy() {
				img.removeEventListener('load', onLoad);
			}
		};
	};
</script>

<div
	class={['relative inline-flex max-h-full max-w-full items-center justify-center', className]}
	aria-busy={showSpinner}
>
	{#key src}
		<img
			src={staticSrc(src)}
			{alt}
			class={[
				'max-h-full max-w-full cursor-pointer object-contain transition-opacity duration-200',
				paintReady ? 'opacity-0' : 'opacity-100'
			]}
			decoding="async"
			draggable="false"
		/>
	{/key}

	{#if !fullFailed}
		{#key fullSrc}
			<img
				use:fullImgAction={fullSrc}
				src={fullSrc}
				alt=""
				aria-hidden="true"
				class={[
					'absolute inset-0 m-auto max-h-full max-w-full cursor-pointer object-contain transition-opacity duration-200',
					paintReady ? 'opacity-100' : 'opacity-0'
				]}
				decoding="async"
				draggable="false"
				onerror={onfullerror}
			/>
		{/key}
	{/if}

	{#if showSpinner}
		<div
			class="pointer-events-none absolute inset-0 grid place-items-center"
			role="status"
			aria-label="Loading full resolution image"
		>
			<svg
				class="size-8 animate-spin text-white/80"
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
				<path
					class="opacity-90"
					fill="currentColor"
					d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
				/>
			</svg>
		</div>
	{/if}
</div>
