export type MediaKind = 'image' | 'video';

export type MediaAsset = {
	src: string;
	fullSrc: string;
	alt: string;
	width: number;
	height: number;
	kind: MediaKind;
	caption?: string;
};

export type GalleryMedia = MediaAsset & {
	id: string;
	category: string;
};

export type CoupleSection = {
	id: string;
	label: string;
	media: GalleryMedia[];
	slider?: MediaAsset[];
};

export type PortfolioContent = {
	categories: string[];
	media: GalleryMedia[];
	couples: CoupleSection[];
};

export type SiteManifest = {
	syncedAt: string;
	hero: MediaAsset;
	about: MediaAsset;
	homeAbout: MediaAsset;
	contact: MediaAsset;
	homeGrid: MediaAsset[];
	portfolio: PortfolioContent;
};

export function isVideo(asset: MediaAsset): boolean {
	return asset.kind === 'video';
}
