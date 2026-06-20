export type PointerSample = { x: number; t: number };

export type SwipeIntent = 'prev' | 'next' | 'stay';

/** Movement below this is ignored until horizontal vs vertical intent is decided. */
export const SWIPE_LOCK_PX = 8;
/** Movement past this marks a drag (not a tap). */
export const SWIPE_DRAG_PX = 6;
export const SWIPE_VELOCITY_THRESHOLD = 0.1;
export const SWIPE_DISTANCE_RATIO = 0.5;
/** Only the last N ms of movement count toward release velocity (flicks expire while held). */
export const SWIPE_VELOCITY_WINDOW_MS = 100;

export function pushPointerSample(samples: PointerSample[], x: number, t: number, max = 12) {
	samples.push({ x, t });

	const cutoff = t - SWIPE_VELOCITY_WINDOW_MS * 1.5;
	while (samples.length > max || (samples.length > 2 && samples[0].t < cutoff)) {
		samples.shift();
	}
}

export function getPointerVelocity(
	samples: PointerSample[],
	windowMs = SWIPE_VELOCITY_WINDOW_MS
): number {
	if (samples.length < 2) return 0;

	const last = samples[samples.length - 1];
	const cutoff = last.t - windowMs;
	let first = samples[0];

	for (const sample of samples) {
		if (sample.t >= cutoff) {
			first = sample;
			break;
		}
	}

	const dt = last.t - first.t;
	if (dt < 16) return 0;

	return (last.x - first.x) / dt;
}

export function resolveSwipeIntent(params: {
	displacement: number;
	velocity: number;
	width: number;
	velocityThreshold?: number;
	distanceRatio?: number;
}): SwipeIntent {
	const {
		displacement,
		velocity,
		width,
		velocityThreshold = SWIPE_VELOCITY_THRESHOLD,
		distanceRatio = SWIPE_DISTANCE_RATIO
	} = params;

	if (width <= 0) return 'stay';

	const distanceThreshold = width * distanceRatio;

	if (Math.abs(displacement) > distanceThreshold) {
		return displacement > 0 ? 'prev' : 'next';
	}

	const displacementSign = Math.sign(displacement);
	const velocitySign = Math.sign(velocity);

	if (
		Math.abs(velocity) > velocityThreshold &&
		displacementSign !== 0 &&
		displacementSign === velocitySign
	) {
		return velocity > 0 ? 'prev' : 'next';
	}

	return 'stay';
}

export function swipeDurationMs(remainingPx: number, velocity: number, fallback = 320): number {
	if (Math.abs(velocity) < 0.05) return fallback;

	const projected = Math.abs(remainingPx / velocity);
	return Math.min(480, Math.max(180, projected));
}

export function modIndex(value: number, count: number): number {
	if (count <= 0) return 0;
	return ((value % count) + count) % count;
}

export function clampIndex(index: number, count: number): number {
	if (count <= 0) return 0;
	return Math.max(0, Math.min(count - 1, index));
}

/** Shortest scroll delta in slide units, using wrap only when linear path is longer than half the track. */
export function scrollAnimationDelta(
	scrollIndex: number,
	targetIndex: number,
	count: number
): number {
	const linear = targetIndex - scrollIndex;
	if (count <= 1) return linear;

	if (Math.abs(linear) <= count / 2) return linear;

	return linear > 0 ? linear - count : linear + count;
}

export function scrollFraction(scrollIndex: number): number {
	return scrollIndex - Math.floor(scrollIndex);
}

export function easeOutCubic(t: number): number {
	return 1 - (1 - t) ** 3;
}

/** Full-bleed track offset for a fractional scroll index (one slide = viewport width). */
export function fullBleedTranslateX(scrollIndex: number, viewportWidth: number): number {
	return -viewportWidth + -scrollFraction(scrollIndex) * viewportWidth;
}

/** Layout for a peek carousel with fixed-width cards centered in the viewport. */
export function peekCarouselLayout(params: {
	viewportWidth: number;
	cardPx: number;
	gap: number;
	index: number;
	count: number;
}) {
	const { viewportWidth, cardPx, gap, index, count } = params;
	const stride = cardPx + gap;
	const sidePad = viewportWidth > 0 ? (viewportWidth - cardPx) / 2 : 0;
	const trackWidth = count * cardPx + (count - 1) * gap;
	const targetOffset =
		viewportWidth > 0 ? viewportWidth / 2 - (sidePad + index * stride + cardPx / 2) : 0;

	return { sidePad, stride, trackWidth, targetOffset };
}

/** Rubber-band drag past the first or last slide. */
export function boundedDragOffset(
	dx: number,
	atStart: boolean,
	atEnd: boolean,
	factor = 0.25
): number {
	if (atStart && dx > 0) return dx * factor;
	if (atEnd && dx < 0) return dx * factor;
	return dx;
}

export function animateCarouselValue(params: {
	from: number;
	to: number;
	velocity: number;
	onUpdate: (value: number) => void;
	onComplete?: () => void;
	shouldCancel?: () => boolean;
	fallbackDuration?: number;
}): () => void {
	const {
		from,
		to,
		velocity,
		onUpdate,
		onComplete,
		shouldCancel,
		fallbackDuration = 320
	} = params;

	let animFrame: number | null = null;

	function cancel() {
		if (animFrame !== null) {
			cancelAnimationFrame(animFrame);
			animFrame = null;
		}
	}

	const remaining = Math.abs(to - from);
	if (remaining < 0.5) {
		onUpdate(to);
		onComplete?.();
		return cancel;
	}

	const duration = swipeDurationMs(remaining, Math.abs(velocity), fallbackDuration);
	const startTime = performance.now();

	function step(now: number) {
		if (shouldCancel?.()) {
			cancel();
			return;
		}

		const t = Math.min(1, (now - startTime) / duration);
		onUpdate(from + (to - from) * easeOutCubic(t));

		if (t < 1) {
			animFrame = requestAnimationFrame(step);
			return;
		}

		onUpdate(to);
		cancel();
		onComplete?.();
	}

	animFrame = requestAnimationFrame(step);
	return cancel;
}

/** True when a pointer event is in a video's native control bar (bottom strip). */
export function isVideoControlInteraction(event: PointerEvent, controlBarHeight = 48): boolean {
	const hit = document.elementFromPoint(event.clientX, event.clientY);
	const video = hit?.closest('video');
	if (!(video instanceof HTMLVideoElement)) return false;

	const rect = video.getBoundingClientRect();
	return event.clientY >= rect.bottom - controlBarHeight;
}
