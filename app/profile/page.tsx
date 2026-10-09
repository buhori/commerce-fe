import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getCustomer } from "@/lib/customer-api";

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/login?next=/profile");

  return (
    <>
      <header className="profile-heading">
        <h1>Akun Saya</h1>
      </header>
      <ProfileForm customer={customer} />
    </>
  );
}
