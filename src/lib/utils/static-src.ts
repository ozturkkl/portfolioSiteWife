import { base } from '$app/paths';

/** Prefix a path from media.json with the deploy base (e.g. GitHub Pages subpath). */
export function staticSrc(path: string): string {
	return `${base}${path}`;
}
