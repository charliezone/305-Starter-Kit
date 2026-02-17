import { getAdminUsers } from "@/features/admin";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { UsersTable } from "@/features/admin/components/users-table";

export const metadata = {
  title: "Users — Admin — 305 Starter Kit",
};

export default async function AdminUsersPage() {
  const { items, total } = await getAdminUsers();

  return (
    <AdminShell>
      <UsersTable users={items} total={total} />
    </AdminShell>
  );
}
