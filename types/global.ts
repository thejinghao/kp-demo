export {};

declare global {
	interface Window {
		KlarnaOnsiteService?: {
			push: (event: { eventName: string }) => void;
		};
		setPrice?: (productIndex: number) => void;
		setLocale?: (locale: string) => void;
	}
}
