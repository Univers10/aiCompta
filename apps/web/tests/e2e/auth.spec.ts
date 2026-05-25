import { test, expect } from '@playwright/test';

test('accès à /inbox redirige vers /login si non connecté', async ({ page }) => {
  await page.goto('/inbox');
  await expect(page).toHaveURL(/\/login$/);
});

test('la page de connexion affiche le formulaire', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText(/Connexion/i).first()).toBeVisible();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
});
