# Supabase Context

This Ionic Vue project uses Supabase for database access and authentication.

- The shared, typed Supabase client is in `src/lib/supabase.ts`.
- Generated database types are in `src/types/database.types.ts`.
- Never use a `service_role` key or any secret Supabase key in frontend code.
- Always use the generated `Database` type when working with Supabase.
- All Supabase queries must use the existing client exported from `src/lib/supabase.ts`.

## Generate Database Types

For the Supabase project configured in this repository, run:

```sh
npx supabase gen types typescript --project-id maiprxrkxgnewkzbxntp --schema public > src/types/database.types.ts
```

Run the command again whenever the database schema changes. The generated file
replaces the placeholder currently stored at `src/types/database.types.ts`.

## Typed Query Example

See `src/views/SupabaseTableExamplePage.vue`. It demonstrates a typed query
against the `departments` table. For another table, use its generated name in
both the row type and the query:

```ts
type Employee = Database["public"]["Tables"]["employees"]["Row"];
const { data, error } = await supabase.from("employees").select("*");
```
