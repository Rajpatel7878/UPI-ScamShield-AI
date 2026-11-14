import { AppLayout } from "@/components/layout/AppLayout.jsx";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute.jsx";

export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}
