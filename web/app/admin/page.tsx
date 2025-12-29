import { redirect } from "next/navigation";

/**
 * Admin root page - redirects to dashboard
 */
export default function AdminPage() {
  redirect("/admin/dashboard");
}
