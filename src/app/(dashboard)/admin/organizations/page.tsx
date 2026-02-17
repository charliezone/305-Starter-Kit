import { getAdminOrganizations } from "@/features/admin";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { OrganizationsTable } from "@/features/admin/components/organizations-table";

export const metadata = {
  title: "Organizations — Admin — 305 Starter Kit",
};

export default async function AdminOrganizationsPage() {
  const { items, total } = await getAdminOrganizations();

  return (
    <AdminShell>
      <OrganizationsTable organizations={items} total={total} />
    </AdminShell>
  );
}
