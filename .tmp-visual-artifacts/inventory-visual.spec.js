const { test, expect } = require('@playwright/test');
const path = require('node:path');

test.setTimeout(120000);

test('inventory transfer flow and actions menu stay usable', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://127.0.0.1:5174', { waitUntil: 'networkidle' });

  await page.getByLabel('Player de acceso').fill('visuallead');
  await page.getByLabel('Contraseña').fill('LeadTest123!');
  await page.getByRole('button', { name: 'Continuar' }).click();

  await expect(page.locator('aside')).toBeVisible();
  await page.locator('aside').getByRole('button', { name: 'Inventario' }).click();
  await page.getByRole('button', { name: 'Insumos para pedidos' }).click();

  await expect(page.getByRole('heading', { name: 'Control de transferencias' })).toBeVisible();
  await page.getByRole('button', { name: /Nueva transferencia/ }).click();

  await expect(page.getByRole('heading', { name: 'Registrar transferencia' })).toBeVisible();
  await page.getByLabel('Insumo').selectOption({ label: /VISUAL-ORD-001/ });
  await page.getByLabel('Cantidad a transferir').fill('4');
  await page.getByLabel('Resguardo / punto de entrega').fill('Estación Á');
  await page.getByLabel('Nave / destino').fill('Náve 1');
  await page.getByLabel('Quién tomó el material').fill('Equipo QA');

  const remainingField = page.getByLabel('¿Cuántas unidades quedan ahora en ese destino?');
  await expect(remainingField).toBeVisible();
  await remainingField.fill('3');
  await page.getByLabel('Notas').fill('Retranferencia visual QA');
  await page.getByRole('button', { name: 'Guardar transferencia' }).click();

  await expect(page.getByText('Transferencia registrada.')).toBeVisible();
  await page.getByRole('button', { name: /Ver saldos/ }).click();
  await expect(page.getByRole('heading', { name: 'Transferencias por destino' })).toBeVisible();
  await expect(page.getByText('VISUAL-ORD-001 · Stock general 35 pzas')).toBeVisible();
  await expect(page.getByText('Náve 1')).toBeVisible();
  await expect(page.getByText('Estación Á')).toBeVisible();
  await expect(page.getByText(/7 pzas/).first()).toBeVisible();
  await expect(page.getByText('Se reportaron 3 pzas restantes antes de esta transferencia.')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar' }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  const actionsButton = page.getByLabel('Abrir acciones de inventario');
  await actionsButton.click();
  const dropdown = page.locator('.inventory-actions-menu-shell .custom-board-actions-dropdown');
  await expect(dropdown).toBeVisible();

  const box = await dropdown.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual((viewport?.width || 390) + 1);
  expect(box.y).toBeGreaterThanOrEqual(0);

  await page.screenshot({
    path: path.join('C:', 'Users', 'alexx', 'Desktop', 'COPMEC', '.tmp-visual-artifacts', 'inventory-menu-mobile.png'),
    fullPage: false,
  });
});
