import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

const fileEnv = loadEnvFile(".env.local");
const projectRef = "maiprxrkxgnewkzbxntp";
const supabaseUrl = fileEnv.VITE_SUPABASE_URL;
const accessToken = fileEnv.SUPABASE_ACCESS_TOKEN;
const password = process.env.ROLE_TEST_USER_PASSWORD || "123456";
const roleAccounts = [
  { profileId: 1, email: "admin@example.com", username: "admin", role: "Admin" },
  { profileId: 2, email: "hr.manager@example.com", username: "hr.manager", role: "HR Manager" },
  { profileId: 3, email: "manager@example.com", username: "manager", role: "Manager" },
  { profileId: 4, email: "employee1@example.com", username: "employee1", role: "Employee" },
];

if (!supabaseUrl || !accessToken) {
  throw new Error("VITE_SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required in .env.local.");
}

const keyResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

if (!keyResponse.ok) {
  throw new Error(`Unable to load project API keys: ${keyResponse.status} ${await keyResponse.text()}`);
}

const apiKeys = await keyResponse.json();
const serviceRoleKey = apiKeys.find((key) => key.name === "service_role")?.api_key;

if (!serviceRoleKey) {
  throw new Error("The linked project did not return a service_role API key.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: unlinkError } = await supabase
  .from("app_users")
  .update({ auth_user_id: null })
  .not("auth_user_id", "is", null);
if (unlinkError) throw unlinkError;

const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (authUsersError) throw authUsersError;

for (const authUser of authUsersData.users) {
  const { error } = await supabase.auth.admin.deleteUser(authUser.id);
  if (error) throw error;
}

const roleIds = new Map();
for (const account of roleAccounts) {
  if (!roleIds.has(account.role)) {
    const { data, error } = await supabase.from("roles").select("id").eq("name", account.role).single();
    if (error) throw error;
    roleIds.set(account.role, data.id);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: { role: account.role },
  });
  if (error) throw error;

  const { error: profileError } = await supabase
    .from("app_users")
    .update({
      auth_user_id: data.user.id,
      email: account.email,
      username: account.username,
      role_id: roleIds.get(account.role),
      is_active: true,
    })
    .eq("id", account.profileId);
  if (profileError) throw profileError;

  console.log(`${account.role}: ${account.email} linked`);
}

const activeProfileIds = roleAccounts.map((account) => account.profileId);
const { error: deactivateError } = await supabase
  .from("app_users")
  .update({ auth_user_id: null, is_active: false })
  .not("id", "in", `(${activeProfileIds.join(",")})`);
if (deactivateError) throw deactivateError;

console.log("All previous Auth users were deleted. Four role test users are ready.");
