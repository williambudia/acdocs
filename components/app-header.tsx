"use client";

import { Moon, Sun, Globe, PanelLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/context";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center px-4 shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)]">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 size-8"
          onClick={toggleSidebar}
        >
          <PanelLeft className="size-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      )}
      <h1 className="flex-1 text-lg font-semibold truncate">{title}</h1>

      <div className="flex items-center gap-1">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <Globe className="size-4" />
              <span className="sr-only">Language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setLocale("pt")}
              className={locale === "pt" ? "bg-accent" : ""}
            >
              Português
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocale("en")}
              className={locale === "en" ? "bg-accent" : ""}
            >
              English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
