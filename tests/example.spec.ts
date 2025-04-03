import { expect, test } from '@playwright/test';

test('hello world test', async ({ page }) => {
	await page.goto('http://localhost:4321/');
	const title = await page.title();
	expect(title).toBe('Iniciar sesión');
});
