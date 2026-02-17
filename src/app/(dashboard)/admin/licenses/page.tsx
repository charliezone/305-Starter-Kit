import { getAdminLicenseKeys } from "@/features/admin";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { LicensesTable } from "@/features/admin/components/licenses-table";
import { CreateLicenseForm } from "@/features/admin/components/create-license-form";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Licenses — Admin — 305 Starter Kit",
};

export default async function AdminLicensesPage() {
  const { items, total } = await getAdminLicenseKeys();

  return (
    <AdminShell>
      <div className="space-y-6">
        <CreateLicenseForm />
        <Separator />
        <LicensesTable licenses={items} total={total} />
      </div>
    </AdminShell>
  );
}
