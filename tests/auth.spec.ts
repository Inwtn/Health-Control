import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Contract tests with mocked Supabase HTTP endpoints. Real RLS is tested separately in SQL.
const ids: Record<string, string> = {
  "ana@example.test": "11111111-1111-4111-8111-111111111111",
  "bia@example.test": "22222222-2222-4222-8222-222222222222",
};
const expiresAt = Math.floor(Date.now() / 1000) + 3600;
function session(email: string) {
  const id = ids[email];
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, exp: expiresAt, role: "authenticated" })).toString("base64url")}.test`;
  return {
    access_token: token,
    refresh_token: "test-refresh",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id,
      aud: "authenticated",
      role: "authenticated",
      email,
      email_confirmed_at: "2026-01-01T00:00:00Z",
      user_metadata: {},
      app_metadata: { provider: "email" },
      created_at: "2026-01-01T00:00:00Z",
    },
  };
}
async function mockBackend(page: Page) {
  const records = new Map<string, { data: unknown; revision: number }>();
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  const flags = {
    failRead: false,
    failSave: false,
    conflict: false,
    slowSave: false,
  };
  await page.route("https://accounts.example.test/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const body = req.postDataJSON() ?? {};
    calls.push({ path: url.pathname, body });
    const json = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: {
          "x-supabase-api-version": "2024-01-01",
          "access-control-expose-headers": "x-supabase-api-version",
        },
        body: JSON.stringify(data),
      });
    if (url.pathname.endsWith("/token"))
      return body.password === "wrong-password"
        ? json(
            { code: "invalid_credentials", msg: "Invalid login credentials" },
            400,
          )
        : json(session(body.email));
    if (url.pathname.endsWith("/signup"))
      return json({ user: session("ana@example.test").user, session: null });
    if (url.pathname.endsWith("/recover")) return json({});
    if (url.pathname.endsWith("/logout")) return json({});
    if (url.pathname.endsWith("/user"))
      return json(session("ana@example.test").user);
    if (url.pathname.endsWith("/health_records")) {
      const token = req.headers().authorization?.replace("Bearer ", "");
      const owner = Object.keys(ids).find(
        (email) => session(email).access_token === token,
      );
      if (
        !owner ||
        (url.searchParams.get("user_id")?.replace("eq.", "") !== ids[owner] &&
          req.method() !== "POST")
      )
        return json({ message: "forbidden" }, 403);
      const id = ids[owner];
      if (req.method() === "GET")
        return flags.failRead
          ? json({ message: "unavailable" }, 403)
          : json(records.get(id) ?? null);
      if (flags.slowSave)
        await new Promise((resolve) => setTimeout(resolve, 900));
      if (flags.failSave) return json({ message: "unavailable" }, 503);
      const previous = records.get(id);
      if (
        flags.conflict ||
        (req.method() === "PATCH" &&
          url.searchParams.get("revision") !== `eq.${previous?.revision}`)
      )
        return json(null);
      if (req.method() === "POST" && (body.user_id !== id || previous))
        return json({ code: "23505" }, 409);
      const next = { data: body.data, revision: (previous?.revision ?? 0) + 1 };
      records.set(id, next);
      return json({ revision: next.revision });
    }
    return json({ message: "unexpected endpoint" }, 404);
  });
  return { records, calls, flags };
}
async function login(page: Page, email = "ana@example.test") {
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("long-password-123");
  await page.getByRole("button", { name: "Entrar na minha conta" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Seu bem-estar, todos os dias.",
  );
}
async function logout(page: Page) {
  const menu = page.getByRole("button", { name: "Abrir menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Que bom ter você aqui.",
  );
}

test("cadastro valida confirmação e informa verificação de e-mail; recuperação não revela contas", async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Seu nome").fill("Ana");
  await page.getByLabel("E-mail", { exact: true }).fill("ana@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("long-password-123");
  await page.getByLabel("Confirmar senha").fill("other-password");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "As senhas precisam ser iguais",
  );
  expect(backend.calls.filter((c) => c.path.endsWith("/signup"))).toHaveLength(
    0,
  );
  await page.getByLabel("Confirmar senha").fill("long-password-123");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("status")).toContainText("Confira seu e-mail");
  await expect(page.locator(".app-shell")).toHaveCount(0);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await page
    .getByRole("button", { name: "Enviar link de recuperação" })
    .click();
  await expect(page.getByRole("status")).toContainText("Se houver uma conta");
});

test("login, persistência remota e troca de usuário não misturam registros", async ({
  page,
}) => {
  const { records } = await mockBackend(page);
  await page.goto("/");
  await login(page);
  await page.getByRole("button", { name: "500 ml", exact: true }).click();
  await expect(page.locator(".private-label")).toContainText(
    "Salvo na sua conta",
  );
  expect(records.get(ids["ana@example.test"])).toBeTruthy();
  expect(
    await page.evaluate(() => localStorage.getItem("health-control:v1")),
  ).toBeNull();
  await page.reload();
  await expect(page.locator(".water-summary strong")).toContainText("0,5");
  await logout(page);
  await login(page, "bia@example.test");
  await expect(page.locator(".water-summary strong")).toContainText("0 / 2 L");
  await page.getByRole("button", { name: "200 ml", exact: true }).click();
  await expect(page.locator(".private-label")).toContainText(
    "Salvo na sua conta",
  );
  await logout(page);
  await login(page);
  await expect(page.locator(".water-summary strong")).toContainText("0,5");
});

test("erro de senha e leitura falha mantêm o painel fechado sem sobrescrever registros", async ({
  page,
}) => {
  const { flags, records } = await mockBackend(page);
  await page.goto("/");
  await page.getByLabel("E-mail", { exact: true }).fill("ana@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Entrar na minha conta" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "E-mail ou senha incorretos",
  );
  flags.failRead = true;
  await page.getByLabel("Senha", { exact: true }).fill("long-password-123");
  await page.getByRole("button", { name: "Entrar na minha conta" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Não foi possível carregar sua conta.",
  );
  expect(records.size).toBe(0);
  await expect(page.locator(".app-shell")).toHaveCount(0);
});

test("falha de salvamento permite tentar novamente; conflito pausa a gravação", async ({
  page,
}) => {
  const { flags, records } = await mockBackend(page);
  await page.goto("/");
  await login(page);
  flags.failSave = true;
  await page.getByRole("button", { name: "500 ml", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível salvar",
  );
  expect(records.size).toBe(0);
  flags.failSave = false;
  await page.getByRole("button", { name: "Tentar salvar novamente" }).click();
  await expect(page.locator(".private-label")).toContainText(
    "Salvo na sua conta",
  );
  flags.conflict = true;
  await page.getByRole("button", { name: "200 ml", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "outra aba ou dispositivo",
  );
  await expect(
    page.getByRole("button", { name: "Tentar salvar novamente" }),
  ).toHaveCount(0);
  expect(
    (records.get(ids["ana@example.test"])?.data as { water: unknown[] }).water,
  ).toHaveLength(1);
});

test("alterações feitas durante uma gravação lenta também são salvas", async ({
  page,
}) => {
  const { flags, records } = await mockBackend(page);
  flags.slowSave = true;
  await page.goto("/");
  await login(page);
  await page.getByRole("button", { name: "500 ml", exact: true }).click();
  await expect.poll(() => records.size, { timeout: 500 }).toBe(0);
  await page.waitForTimeout(650);
  await page.getByRole("button", { name: "200 ml", exact: true }).click();
  await expect(page.locator(".private-label")).toContainText(
    "Salvo na sua conta",
  );
  expect(
    (records.get(ids["ana@example.test"])?.data as { water: unknown[] }).water,
  ).toHaveLength(2);
});

test("link de recuperação permite trocar senha; telas de acesso são acessíveis e responsivas", async ({
  page,
}) => {
  const { calls } = await mockBackend(page);
  await page.goto("/");
  const check = async () => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(page.viewportSize()!.width);
  };
  await check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await check();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await check();
  const s = session("ana@example.test");
  await page.goto("about:blank");
  await page.goto(
    `http://127.0.0.1:5174/#access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer&type=recovery`,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Crie sua nova senha.",
  );
  await page
    .getByLabel("Nova senha", { exact: true })
    .fill("new-long-password");
  await page.getByLabel("Confirmar senha").fill("new-long-password");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.locator(".app-shell")).toBeVisible();
  expect(
    calls.some(
      (c) =>
        c.path.endsWith("/user") && c.body.password === "new-long-password",
    ),
  ).toBe(true);
});

test("registros antigos só são importados com confirmação; exclusão limpa a conta e mantém o acesso", async ({
  page,
}) => {
  const { records } = await mockBackend(page);
  const legacy = {
    version: 1,
    profile: null,
    training: null,
    entries: [],
    water: [],
    waterGoal: 2600,
    completed: {},
  };
  await page.addInitScript(
    (value) => localStorage.setItem("health-control:v1", JSON.stringify(value)),
    legacy,
  );
  await page.goto("/");
  await login(page);
  await expect(page.locator(".water-summary strong")).toContainText("0 / 2 L");
  expect(records.size).toBe(0);
  if (
    await page
      .getByRole("button", { name: "Abrir menu", exact: true })
      .isVisible()
  )
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page.getByRole("button", { name: "Meu perfil e dados" }).click();
  await page
    .getByRole("button", { name: "Importar registros da versão anterior" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar" })
    .click();
  expect(records.size).toBe(0);
  await page
    .getByRole("button", { name: "Importar registros da versão anterior" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Importar meus registros", exact: true })
    .click();
  await expect(page.locator(".private-label")).toContainText(
    "Salvo na sua conta",
  );
  expect(
    (records.get(ids["ana@example.test"])?.data as typeof legacy).waterGoal,
  ).toBe(2600);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar meus dados" }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  let json = "";
  for await (const chunk of stream!) json += chunk.toString();
  expect(JSON.parse(json).waterGoal).toBe(2600);
  await page
    .getByRole("button", { name: "Excluir meus dados", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Excluir definitivamente" })
    .click();
  await expect(page.locator(".private-label")).toContainText(
    "Salvo na sua conta",
  );
  expect(
    (records.get(ids["ana@example.test"])?.data as typeof legacy).waterGoal,
  ).toBe(2000);
  expect(
    JSON.parse(
      (await page.evaluate(() => localStorage.getItem("health-control:v1"))) ??
        "{}",
    ).waterGoal,
  ).toBe(2600);
  await expect(page.locator(".account-email")).toHaveText("ana@example.test");
});
