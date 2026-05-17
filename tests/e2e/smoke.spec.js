import { test, expect } from '@playwright/test'

test('home page loads and has main nav', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'الرئيسية', exact: true })).toBeVisible()
})

test('login page renders', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'دخول', exact: true })).toBeVisible()
})
