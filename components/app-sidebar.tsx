"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  FileText,
  Users,
  UsersRound,
  ClipboardList,
  LogOut,
  PanelLeft,
  ChevronLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, logout, can } = useAuth();
  const { open, toggleSidebar } = useSidebar();

  const mainNav = [
    {
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      href: "/dashboard",
      show: true,
    },
    {
      label: t.nav.structure,
      icon: FolderTree,
      href: "/categories",
      show: can("categories:read"),
    },
    {
      label: t.nav.documents,
      icon: FileText,
      href: "/documents",
      show: can("documents:read"),
    },
    {
      label: t.nav.groups,
      icon: UsersRound,
      href: "/groups",
      show: can("groups:read"),
    },
    {
      label: t.nav.users,
      icon: Users,
      href: "/users",
      show: can("users:read"),
    },
    {
      label: t.nav.auditLog,
      icon: ClipboardList,
      href: "/audit",
      show: can("audit:read"),
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-row items-center gap-2 px-3 shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        {/* Quando fechada: mostra apenas o ícone da sidebar clicável */}
        <button
          onClick={toggleSidebar}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 group-data-[collapsible=icon]:flex hidden group-data-[collapsible=icon]:block"
        >
          <PanelLeft className="size-4" />
        </button>

        {/* Quando aberta: ícone app + nome + seta para fechar */}
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-4" />
            </div>
            <span className="truncate text-lg font-semibold">
              {t.common.appName}
            </span>
          </div>
          
          <button
            onClick={toggleSidebar}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            title="Fechar sidebar"
          >
            <ChevronLeft className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav
                .filter((item) => item.show)
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={user?.name ?? ""}>
              <div className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {user?.name?.charAt(0) ?? "?"}
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.role && t.users.roles[user.role]}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t.auth.logout}
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              <LogOut className="size-4" />
              <span>{t.auth.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
