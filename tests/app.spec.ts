import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function navigate(page: Page, name: string) {
  if (
    await page
      .getByRole("button", { name: "Abrir menu", exact: true })
      .isVisible()
  )
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
}
async function fillProfile(page: Page, age = "30") {
  await page
    .getByRole("button", { name: "Criar meu plano", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Como podemos chamar você?").fill("Ana");
  await dialog.getByLabel("Idade", { exact: true }).fill(age);
  await dialog.getByLabel("Peso atual (kg)").fill("70");
  await dialog.getByLabel("Altura (cm)").fill("170");
  await dialog
    .getByLabel("Quantas vezes faz atividade na semana?")
    .selectOption("4");
  await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
  await dialog.getByRole("button", { name: "Salvar meu perfil" }).click();
  await expect(dialog).toBeHidden();
}

test("perfil, metabolismo e sugestões de refeições persistem", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await fillProfile(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ana");
  await navigate(page, "Meu plano");
  await expect(page.locator(".metric-card").nth(0)).toContainText("1.452");
  await expect(page.locator(".metric-card").nth(1)).toContainText("2.250");
  await page
    .getByRole("button", { name: "Registrar refeição no dia" })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Refeição já registrada" }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ana");
  await navigate(page, "Diário alimentar");
  await expect(page.locator(".meal-entry")).toHaveCount(3);
  expect(errors).toEqual([]);
});
test("porção de alimento recalcula nutrientes e pode ser removida", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Diário alimentar");
  await page
    .getByRole("button", { name: "Adicionar alimento em Almoço", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Buscar alimento", exact: true })
    .fill("arroz integral cozido");
  await dialog.getByRole("button", { name: /Arroz, integral, cozido/ }).click();
  await dialog.getByLabel("Quantidade (g)").fill("150");
  await expect(dialog.locator(".portion-macros")).toContainText("186");
  await dialog
    .getByText("Ver fibras e todos os micronutrientes disponíveis")
    .click();
  await expect(dialog.locator(".nutrient-grid")).toContainText("N/D");
  await dialog.getByRole("button", { name: "Adicionar ao diário" }).click();
  await expect(page.locator(".calorie-ring strong")).toHaveText("186");
  await expect(page.locator(".meal-entry")).toContainText("150 g");
  await page
    .getByRole("button", {
      name: "Excluir Arroz, integral, cozido",
      exact: true,
    })
    .click();
  await expect(page.locator(".calorie-ring strong")).toHaveText("0");
});
test("água soma, permite meta própria, separa dias e exclui registros", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Diário alimentar");
  await page.getByRole("button", { name: "200 ml", exact: true }).click();
  await page.getByRole("button", { name: "500 ml", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Registrar outra quantidade de água",
      exact: true,
    })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Quantidade de água (ml)").fill("275");
  await dialog
    .getByRole("button", { name: "Registrar água", exact: true })
    .click();
  await expect(page.locator(".water-summary strong")).toContainText("0,98");
  await page
    .getByRole("button", { name: "Editar meta de água", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Meta diária (ml)").fill("2500");
  await dialog
    .getByRole("button", { name: "Salvar meta", exact: true })
    .click();
  await expect(page.locator(".water-summary strong")).toContainText("/ 2,5 L");
  await page.reload();
  await navigate(page, "Diário alimentar");
  await expect(
    page.locator(".water-history > div:not(.card-heading)"),
  ).toHaveCount(3);
  await page.getByRole("button", { name: "Dia anterior", exact: true }).click();
  await expect(page.locator(".water-summary strong")).toContainText(
    "0 / 2,5 L",
  );
  await page.getByRole("button", { name: "350 ml", exact: true }).click();
  await expect(page.locator(".water-summary strong")).toContainText("0,35");
  await page.getByRole("button", { name: "Próximo dia", exact: true }).click();
  await page
    .getByRole("button", { name: "Excluir registro de 275 ml", exact: true })
    .click();
  await expect(page.locator(".water-summary strong")).toContainText("0,7");
});
test("treinos respeitam questionário, persistem marcações e bloqueiam restrições", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Meus treinos");
  await page
    .getByRole("button", { name: "Montar meu treino", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Dias disponíveis na semana").selectOption("4");
  await dialog.getByLabel("Tempo por sessão").selectOption("30");
  await dialog.getByRole("button", { name: "Montar minha rotina" }).click();
  await expect(page.locator(".week-day:not(.rest)")).toHaveCount(4);
  await expect(page.locator(".exercise")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Concluir Leg press", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Desmarcar Leg press" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await navigate(page, "Meus treinos");
  await expect(
    page.getByRole("button", { name: "Desmarcar Leg press" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Ajustar treino" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Montar minha rotina" }).click();
  await expect(page.locator(".exercise")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Vamos cuidar do seu ponto de partida.",
    }),
  ).toBeVisible();
});
test("menores mantêm diário, sem sugestão automática de dieta ou treino", async ({
  page,
}) => {
  await page.goto("/");
  await fillProfile(page, "17");
  await navigate(page, "Meu plano");
  await expect(
    page.getByRole("heading", {
      name: "Seu cuidado merece um plano individual.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Registrar refeição no dia" }),
  ).toHaveCount(0);
  await navigate(page, "Diário alimentar");
  await expect(
    page.getByRole("button", { name: "Adicionar alimento", exact: true }),
  ).toBeVisible();
});
test("biblioteca, visualização de micronutrientes e busca sem resultados", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Alimentos");
  await page
    .getByRole("textbox", { name: "Buscar na biblioteca de alimentos" })
    .fill("banana prata");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: /Banana, prata, crua Frutas e derivados/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Vitamina C");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Fechar", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Buscar na biblioteca de alimentos" })
    .fill("inexistente xyz");
  await expect(
    page.getByRole("heading", { name: "Nenhum alimento encontrado" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(await page.evaluate(() => innerWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
});
test("exclusão exige confirmação e remove os dados pessoais", async ({
  page,
}) => {
  await page.goto("/");
  await fillProfile(page);
  if (
    await page
      .getByRole("button", { name: "Abrir menu", exact: true })
      .isVisible()
  )
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Meu perfil e dados", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Excluir meus dados", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await expect(page.locator(".profile-card")).toContainText("Ana");
  await page
    .getByRole("button", { name: "Excluir meus dados", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Excluir definitivamente" })
    .click();
  await expect(page.locator(".profile-card")).toContainText(
    "Vamos nos conhecer?",
  );
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("health-control:v1")!),
  );
  expect(stored.profile).toBeNull();
  expect(stored.entries).toEqual([]);
  expect(stored.water).toEqual([]);
});

test("dados locais inválidos são preservados e podem ser exportados", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("health-control:v1", "{dados anteriores inválidos"),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Não sobrescrevemos o conteúdo anterior",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("health-control:v1")),
  ).toBe("{dados anteriores inválidos");
  if (
    await page
      .getByRole("button", { name: "Abrir menu", exact: true })
      .isVisible()
  )
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page
    .getByRole("button", { name: "Meu perfil e dados", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar meus dados" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("health-control-meus-dados.json");
  const stream = await download.createReadStream();
  let content = "";
  for await (const chunk of stream!) content += chunk.toString();
  expect(content).toBe("{dados anteriores inválidos");
});

test("painel, formulários e abas atendem às verificações automáticas de acessibilidade", async ({
  page,
}) => {
  await page.goto("/");
  const check = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  };
  await check();
  await page
    .getByRole("button", { name: "Criar meu plano", exact: true })
    .click();
  await check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Fechar janela" })
    .click();
  await fillProfile(page);
  for (const name of [
    "Meu plano",
    "Diário alimentar",
    "Alimentos",
    "Meus treinos",
  ]) {
    await navigate(page, name);
    await check();
  }
});
