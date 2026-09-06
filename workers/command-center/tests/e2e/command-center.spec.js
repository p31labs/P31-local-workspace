/**
 * E2E Test Suite - Playwright Browser Automation
 * Tests full user flows through the EPCP Command Center
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('E2E: Full Happy Path', () => {
  test('E2E-01: Login, view dashboard, and verify fleet data', async ({ page, context }) => {
    // Navigate to the command center
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    
    // If using Cloudflare Access, this would need authentication
    // For now we test the direct dashboard route
    await page.goto(baseURL + '/', { waitUntil: 'networkidle' });

    // Verify page title
    await expect(page).toHaveTitle(/G\.O\.D\.\s*\/\s*EPCP Command Center/);

    // Verify KPI cards exist
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards).toHaveCount(3);

    // Verify online workers count is displayed
    const onlineCard = page.locator('.kpi-card').first();
    await expect(onlineCard).toContainText(/Online Nodes/);

    // Verify fleet matrix section exists
    const fleetSection = page.locator('.card:has-text("Fleet Matrix")');
    await expect(fleetSection).toBeVisible();

    // Verify worker rows exist (at least one from status.json)
    const workerRows = page.locator('.worker-row');
    const count = await workerRows.count();
    expect(count).toBeGreaterThan(0);

    // Verify first worker has expected structure
    if (count > 0) {
      const firstWorker = workerRows.first();
      await expect(firstWorker).toContainText(/online|offline|debug|quarantined/i);
    }
  });

  test('E2E-02: Worker drill-down expands to show details', async ({ page }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    await page.goto(baseURL + '/', { waitUntil: 'networkidle' });

    // Click first worker row
    const firstWorker = page.locator('.worker-row').first();
    await firstWorker.click();

    // Verify details panel appears
    const detailsPanel = page.locator('.worker-details').first();
    await expect(detailsPanel).toBeVisible();

    // Verify it contains endpoint link
    const endpointLink = detailsPanel.locator('a');
    await expect(endpointLink).toBeVisible();
  });

  test('E2E-03: Panic quarantine button triggers alert', async ({ page }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    await page.goto(baseURL + '/', { waitUntil: 'networkidle' });

    // Expand worker details
    const firstWorker = page.locator('.worker-row').first();
    await firstWorker.click();

    // Listen for dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('EPCP Policy Enforcement');
      expect(dialog.message()).toContain('Quarantining');
      expect(dialog.type()).toBe('alert');
      await dialog.accept();
    });

    // Click quarantine button
    const quarantineBtn = page.locator('.btn-danger').first();
    await expect(quarantineBtn).toBeVisible();
    await quarantineBtn.click();
  });

  test('E2E-04: Rollback button triggers alert', async ({ page }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    await page.goto(baseURL + '/', { waitUntil: 'networkidle' });

    // Expand worker details
    const firstWorker = page.locator('.worker-row').first();
    await firstWorker.click();

    // Listen for dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('EPCP Artifact Swap');
      expect(dialog.message()).toContain('Rolling back');
      await dialog.accept();
    });

    // Click rollback button (second button)
    const buttons = page.locator('.worker-details .btn');
    const rollbackBtn = buttons.nth(1);
    await expect(rollbackBtn).toBeVisible();
    await rollbackBtn.click();
  });

  test('E2E-05: Legal alert section displays hearing information', async ({ page }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    await page.goto(baseURL + '/', { waitUntil: 'networkidle' });

    // Verify legal alert exists
    const legalAlert = page.locator('.alert-warning');
    await expect(legalAlert).toBeVisible();

    // Verify it contains hearing and case info
    const alertText = await legalAlert.textContent();
    expect(alertText).toMatch(/HEARING|Case/);
  });

  test('E2E-06: Financial telemetry section displays correctly', async ({ page }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    await page.goto(baseURL + '/', { waitUntil: 'networkidle' });

    // Verify financial section exists
    const financialCard = page.locator('.card:has-text("Financial Telemetry")');
    await expect(financialCard).toBeVisible();

    // Verify it shows operating buffer
    const operatingBuffer = financialCard.locator('text=Operating Buffer');
    await expect(operatingBuffer).toBeVisible();
  });

  test('E2E-07: Strategic timeline section displays dates', async ({ page }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    await page.goto(baseURL + '/', { waitUntil: 'networkidle' });

    // Verify timeline section exists
    const timelineSection = page.locator('.card:has-text("Strategic Timeline")');
    await expect(timelineSection).toBeVisible();

    // Verify at least one date row exists
    const dateRows = timelineSection.locator('.date-row');
    expect(await dateRows.count()).toBeGreaterThan(0);
  });

  test('E2E-08: Sync telemetry button reloads data', async ({ page }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    await page.goto(baseURL + '/', { waitUntil: 'networkidle' });

    // Click sync button
    const syncBtn = page.locator('button:has-text("Sync Telemetry")');
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // Verify page still shows data after reload
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards).toHaveCount(3);
  });
});

test.describe('E2E: API Endpoint Integration', () => {
  test('E2E-09: /api/health returns OK', async ({ request }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    const response = await request.get(`${baseURL}/api/health`);
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.ts).toBeDefined();
  });

  test('E2E-10: /api/status returns fleet data', async ({ request }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    const response = await request.get(`${baseURL}/api/status`);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.workers).toBeDefined();
    expect(Array.isArray(json.workers)).toBe(true);
    expect(json.legal).toBeDefined();
    expect(json.financial).toBeDefined();
    expect(json.research).toBeDefined();
    expect(json.dates).toBeDefined();
  });

  test('E2E-11: /api/whoami returns auth status', async ({ request }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    const response = await request.get(`${baseURL}/api/whoami`);
    
    // May be authenticated or not depending on token
    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const json = await response.json();
      expect(json.authenticated).toBeDefined();
    }
  });

  test('E2E-12: POST /api/status with valid token creates worker update', async ({ request }) => {
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:8787';
    const statusToken = process.env.STATUS_TOKEN;
    
    if (!statusToken) {
      console.warn('Skipping E2E-12: No STATUS_TOKEN for write test');
      test.skip();
      return;
    }

    const statusData = {
      workers: [
        { name: 'e2e-test-worker', status: 'online', url: 'https://test.example.com' },
      ],
      legal: { case: 'Test Case', status: 'pending' },
      financial: { operating_buffer: '$100' },
      research: { deployed_workers: 5 },
      dates: [],
    };

    const response = await request.post(`${baseURL}/api/status`, {
      headers: {
        'Authorization': `Bearer ${statusToken}`,
        'Content-Type': 'application/json',
      },
      data: statusData,
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
  });
});
