import { createServiceClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail = process.env.OWNER_EMAIL || "owner@company.com";

  try {
    const supabase = await createServiceClient();
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("company_name")
      .limit(1)
      .single();
    if (profile?.company_name) {
      userEmail = profile.company_name;
    }
  } catch {
    // No profile yet - use default
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={userEmail} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
