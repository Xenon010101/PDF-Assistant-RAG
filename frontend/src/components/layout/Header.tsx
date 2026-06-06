"use client";

import { useState, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Brain,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Moon,
  Shield,
  Sun,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import ApiKeyManager from "@/components/auth/ApiKeyManager";


interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  viewerOpen: boolean;
  onToggleViewer: () => void;
}

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Header({ sidebarOpen, onToggleSidebar, viewerOpen, onToggleViewer }: HeaderProps) {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const languageLabel = (language: string) => {
    switch (language) {
      case "hi":
        return t("common.hindi");
      case "es":
        return t("common.spanish");
      case "fr":
        return t("common.french");
      default:
        return t("common.english");
    }
  };

  const handlePasswordChange = async () => {
    setPasswordStatus(null);
    if (!currentPassword) {
      setPasswordStatus({ type: "error", message: t("settings.oldPasswordIncorrect") });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: t("settings.passwordsDoNotMatch") });
      return;
    }
    setPasswordUpdating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          old_password: currentPassword,
          password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = (errorData as { detail?: string }).detail || t("settings.passwordUpdateFailed");
        if (detail.toLowerCase().includes("old password") || detail.toLowerCase().includes("current password")) {
          setPasswordStatus({ type: "error", message: t("settings.oldPasswordIncorrect") });
        } else {
          setPasswordStatus({ type: "error", message: detail });
        }
        return;
      }
      setPasswordStatus({ type: "success", message: t("settings.passwordUpdated") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordStatus({ type: "error", message: t("settings.passwordUpdateFailed") });
    } finally {
      setPasswordUpdating(false);
    }
  };

  return (
    <>
      <Dialog open={passwordDialogOpen} onOpenChange={(open) => { setPasswordDialogOpen(open); if (!open) { setPasswordStatus(null); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.changePassword")}</DialogTitle>
            <DialogDescription>{t("settings.currentPassword")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {passwordStatus && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                passwordStatus.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                  : "bg-destructive/10 text-destructive border border-destructive/30"
              }`}>
                {passwordStatus.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {passwordStatus.message}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("settings.currentPassword")}</p>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("settings.newPassword")}</p>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("settings.confirmNewPassword")}</p>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handlePasswordChange}
              disabled={passwordUpdating}
            >
              {passwordUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("settings.changePassword")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 bg-card/50 backdrop-blur-md flex-shrink-0 z-50">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleSidebar} title={sidebarOpen ? t("header.closeSidebar") : t("header.openSidebar")}>
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm hidden sm:inline">{t("common.appName")}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleViewer} title={viewerOpen ? t("header.closeViewer") : t("header.openViewer")}>
          {viewerOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </Button>

        {mounted && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} title={isDark ? t("header.lightMode") : t("header.darkMode")}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        )}

        <select
          aria-label={t("common.language")}
          value={i18n.resolvedLanguage || "en"}
          onChange={(e) => void i18n.changeLanguage(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        >
          <option value="en">{languageLabel("en")}</option>
          <option value="hi">{languageLabel("hi")}</option>
          <option value="es">{languageLabel("es")}</option>
          <option value="fr">{languageLabel("fr")}</option>
        </select>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center h-8 gap-2 px-2 rounded-md hover:bg-accent transition-colors cursor-pointer">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                    {user?.username?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm hidden sm:inline">{user?.username}</span>
              </button>
            }
          />

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => setPasswordDialogOpen(true)}>
              <KeyRound className="w-4 h-4 mr-2" />
              {t("settings.changePassword")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user?.is_admin && (
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin")}>
                <Shield className="w-4 h-4 mr-2" />
                Admin metrics
              </DropdownMenuItem>
            )}
            {user?.is_admin && <DropdownMenuSeparator />}
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t("header.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  );
}