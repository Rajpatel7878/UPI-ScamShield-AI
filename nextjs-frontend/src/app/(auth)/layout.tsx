import MainLayout from "@/layouts/MainLayout.jsx";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <MainLayout>{children}</MainLayout>;
}
