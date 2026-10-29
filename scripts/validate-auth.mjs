import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export async function validateAuth() {
  const url = process.env.SUPABASE_URL;
  const publicKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const adminKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey || !adminKey)
    throw new Error("missing_auth_test_binding");
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };
  const admin = createClient(url, adminKey, options);
  const clients = [
    createClient(url, publicKey, options),
    createClient(url, publicKey, options),
  ];
  const created = [];
  const emails = [];
  const check = (result, condition = true) => {
    if (result.error || !condition) {
      const e = new Error("auth_smoke_failed");
      e.code = result.error?.code || "assertion";
      throw e;
    }
    return result.data;
  };
  try {
    for (const client of clients) {
      const email = `hc-smoke-${randomUUID()}@example.test`;
      const password = randomBytes(32).toString("base64url");
      const data = check(
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        }),
      );
      created.push(data.user.id);
      emails.push(email);
      check(await client.auth.signInWithPassword({ email, password }));
    }
    const data = {
      version: 1,
      profile: null,
      training: null,
      entries: [],
      water: [],
      waterGoal: 2000,
      completed: {},
    };
    check(
      await clients[0]
        .from("health_records")
        .insert({ user_id: created[0], data }),
    );
    const own = await clients[0]
      .from("health_records")
      .select("revision")
      .eq("user_id", created[0]);
    check(own, own.data?.length === 1);
    const other = await clients[1]
      .from("health_records")
      .select("data")
      .eq("user_id", created[0]);
    check(other, other.data?.length === 0);
    const spoof = await clients[1]
      .from("health_records")
      .update({ data })
      .eq("user_id", created[0])
      .select("user_id");
    check(spoof, spoof.data?.length === 0);
    const update = await clients[0]
      .from("health_records")
      .update({ data: { ...data, waterGoal: 2500 } })
      .eq("user_id", created[0])
      .eq("revision", 1)
      .select("revision");
    check(update, update.data?.[0]?.revision === 2);
    const stale = await clients[0]
      .from("health_records")
      .update({ data })
      .eq("user_id", created[0])
      .eq("revision", 1)
      .select("revision");
    check(stale, stale.data?.length === 0);
    const link = check(
      await admin.auth.admin.generateLink({
        type: "recovery",
        email: emails[0],
        options: { redirectTo: "https://health-control-eight.vercel.app" },
      }),
    );
    // Never log action_link, verification tokens or hashed tokens.
    const redirect =
      link.properties.redirect_to ||
      new URL(link.properties.action_link).searchParams.get("redirect_to");
    console.log(
      "Auth recovery redirect origin:",
      redirect ? new URL(redirect).origin : "unavailable",
    );
    for (const client of clients) check(await client.auth.signOut());
    const response = await fetch(url + "/auth/v1/settings", {
      headers: { apikey: publicKey },
    });
    if (!response.ok) throw new Error("auth_settings_failed");
    const settings = await response.json();
    if (settings.mailer_autoconfirm) {
      const signupClient = createClient(url, publicKey, options);
      const signup = await signupClient.auth.signUp({
        email: `hc-signup-${randomUUID()}@example.com`,
        password: randomBytes(32).toString("base64url"),
      });
      if (signup.data?.user?.id) created.push(signup.data.user.id);
      check(signup, Boolean(signup.data?.session));
      check(await signupClient.auth.signOut());
      console.log(
        "Public signup with immediate session passed (email confirmation disabled).",
      );
    }

    console.log(
      "Real Auth login/logout and REST isolation checks passed for two temporary accounts.",
    );
    console.log(
      "Email/password enabled:",
      Boolean(settings.external?.email),
      "Email confirmation required:",
      !settings.mailer_autoconfirm,
    );
  } finally {
    let failed = false;
    for (const id of created) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) failed = true;
    }
    if (failed) throw new Error("test_user_cleanup_failed");
    console.log("Temporary Auth accounts removed.");
  }
}
