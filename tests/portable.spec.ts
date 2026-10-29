import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("HTML independente funciona sem carregar arquivos de um servidor", async ({ page }) => {
  const html = readFileSync(new URL("../portable/index.html", import.meta.url), "utf8");
  const unexpected: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    if (route.request().isNavigationRequest() && route.request().url() === "http://127.0.0.1:5173/standalone.html") {
      await route.fulfill({ body: html, contentType: "text/html; charset=utf-8" });
    } else {
      unexpected.push(route.request().url());
      await route.abort();
    }
  });

  await page.goto("http://127.0.0.1:5173/standalone.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seu bem-estar, todos os dias.");
  await expect(page.locator("script[src], link[rel=stylesheet], link[rel=modulepreload]")).toHaveCount(0);
  await expect(page.locator("link[rel=icon]")).toHaveAttribute("href", /^data:image\/svg\+xml/);
  await expect(page.locator(".banner-art img")).toHaveAttribute("src", /^data:image\/svg\+xml/);
  expect(await page.locator(".banner-art img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

  await page.getByRole("button", { name: "500 ml", exact: true }).click();
  await expect(page.locator(".water-summary strong")).toContainText("0,5");
  await page.getByRole("button", { name: "Criar meu plano", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Como podemos chamar você?").fill("Ana");
  await dialog.getByLabel("Idade", { exact: true }).fill("30");
  await dialog.getByLabel("Peso atual (kg)").fill("70");
  await dialog.getByLabel("Altura (cm)").fill("170");
  await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
  await dialog.getByRole("button", { name: "Salvar meu perfil" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ana");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ana");
  await expect(page.locator(".water-summary strong")).toContainText("0,5");
  if (await page.getByRole("button", { name: "Abrir menu", exact: true }).isVisible()) await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page.getByRole("navigation").getByRole("button", { name: "Alimentos", exact: true }).click();
  await page.getByRole("textbox", { name: "Buscar na biblioteca de alimentos" }).fill("banana prata");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: /Banana, prata, crua Frutas e derivados/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Vitamina C");
  await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  expect(unexpected).toEqual([]);
  expect(errors).toEqual([]);
});
