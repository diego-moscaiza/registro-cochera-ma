/// <reference types="astro/client" />
declare namespace App {
	interface Locals {
		email: string;
		displayName: string;
		phone: string;
		otherInfo: any;
	}
}

interface ImportMetaEnv {
	readonly SUPABASE_URL: string;
	readonly SUPABASE_ANON_KEY: strinq;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
