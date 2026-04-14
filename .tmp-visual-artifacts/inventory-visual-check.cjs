const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto('http://127.0.0.1:5174', { waitUntil: 'networkidle' });

    await page.getByLabel('Player de acceso').fill('visuallead');
    await page.getByLabel('Contraseña').fill('LeadTest123!');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.locator('aside').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('aside').getByRole('button', { name: 'Inventario' }).click();
    await page.getByRole('button', { name: 'Insumos para pedidos' }).click();

    await page.getByRole('heading', { name: 'Control de transferencias' }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('button', { name: /Nueva transferencia/ }).click();

    await page.getByRole('heading', { name: 'Registrar transferencia' }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByLabel('Insumo').selectOption({ label: /VISUAL-ORD-001/ });
    await page.getByLabel('Cantidad a transferir').fill('4');
    await page.getByLabel('Resguardo / punto de entrega').fill('Estación Á');
    await page.getByLabel('Nave / destino').fill('Náve 1');
    await page.getByLabel('Quién tomó el material').fill('Equipo QA');

    const remainingField = page.getByLabel('¿Cuántas unidades quedan ahora en ese destino?');
    await remainingField.waitFor({ state: 'visible', timeout: 15000 });
    await remainingField.fill('3');
    await page.getByLabel('Notas').fill('Retranferencia visual QA');
    await page.getByRole('button', { name: 'Guardar transferencia' }).click();

    await page.getByText('Transferencia registrada.').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('button', { name: /Ver saldos/ }).click();
    await page.getByRole('heading', { name: 'Transferencias por destino' }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByText('VISUAL-ORD-001 · Stock general 35 pzas').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByText('Se reportaron 3 pzas restantes antes de esta transferencia.').waitFor({ state: 'visible', timeout: 15000 });

    const viewerText = await page.locator('body').innerText();
    assert(viewerText.includes('Náve 1'), 'Expected destination nave in transfer viewer');
    assert(viewerText.includes('Estación Á'), 'Expected destination storage location in transfer viewer');
    assert(viewerText.includes('7 pzas'), 'Expected updated destination balance of 7 pzas');

    await page.getByRole('button', { name: 'Cerrar' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('Abrir acciones de inventario').click();

    const dropdown = page.locator('.inventory-actions-menu-shell .custom-board-actions-dropdown');
    await dropdown.waitFor({ state: 'visible', timeout: 15000 });
    const box = await dropdown.boundingBox();
    const viewport = page.viewportSize();
    assert(box, 'Expected dropdown bounding box');
    assert(box.x >= 0, `Dropdown starts outside viewport: ${box.x}`);
    assert(box.x + box.width <= (viewport?.width || 390) + 1, `Dropdown exceeds viewport width: ${box.x + box.width} > ${viewport?.width}`);
    assert(box.y >= 0, `Dropdown starts above viewport: ${box.y}`);

    const screenshotPath = path.join('C:', 'Users', 'alexx', 'Desktop', 'COPMEC', '.tmp-visual-artifacts', 'inventory-menu-mobile.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(JSON.stringify({
      ok: true,
      screenshotPath,
      dropdown: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        viewportWidth: viewport?.width,
        viewportHeight: viewport?.height,
      },
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
