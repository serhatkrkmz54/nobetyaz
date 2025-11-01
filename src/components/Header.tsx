'use client';

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, BookUser, Briefcase, Calendar, ChevronDown, CircleUserRound, Clock, FileText, Gavel, GitBranch, LayoutDashboard, MapPin, Send, Settings, ShieldAlert, Tent } from 'lucide-react';
import NotificationBell from "./NotificationBell";
import { cn } from "@/lib/utils";
import { isFeatureEnabledAPI } from "@/services/featureFlagService";

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isBiddingEnabled, setIsBiddingEnabled] = useState(false);
  const [isFlagLoading, setIsFlagLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    const checkFeatures = async () => {
      if (user) {
        setIsFlagLoading(true);
        try {
          const biddingFlag = await isFeatureEnabledAPI('ALLOW_SHIFT_BIDDING');
          setIsBiddingEnabled(biddingFlag);
        } catch {
          setIsBiddingEnabled(false);
        } finally {
          setIsFlagLoading(false);
        }
      } else {
        setIsBiddingEnabled(false);
        setIsFlagLoading(false);
      }
    };
    checkFeatures();

    return () => clearInterval(timer);
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  const isAdminOrScheduler = user?.roles.includes('ROLE_ADMIN') || user?.roles.includes('ROLE_SCHEDULER');

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-semibold text-gray-800">
            NöbetYaz
          </Link>
          <nav className="hidden md:flex items-center gap-2">

            <Link
              href="/dashboard"
              className={cn(
                "text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                pathname === "/dashboard"
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-primary hover:bg-gray-100"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Ana Sayfa
            </Link>

            <Link
              href="/requests"
              className={cn(
                "text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                pathname.startsWith("/requests")
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-primary hover:bg-gray-100"
              )}
            >
              <Send className="h-4 w-4" />
              Talepler
            </Link>

            {!isFlagLoading && isBiddingEnabled && (
              <Link
                href="/bidding"
                className={cn(
                  "text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                  pathname.startsWith("/bidding")
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-primary hover:bg-gray-100"
                )}
              >
                <Gavel className="h-4 w-4" />
                Nöbet Borsası
              </Link>
            )}

            {isAdminOrScheduler && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-md transition-colors group", // 'group' eklendi
                      pathname.startsWith("/management")
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-primary hover:bg-gray-100"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    Yönetim
                    <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-1">
                  <DropdownMenuLabel>Çizelge Yönetimi</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/schedule" className="w-full flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Çizelgeyi Düzenle
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/management/requirements" className="w-full flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Nöbet Gereksinimleri
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/management/holidays">
                      <Tent className="mr-2 h-4 w-4" />
                      Tatil Yönetimi
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Kaynak Yönetimi</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/management/members" className="w-full flex items-center">
                      <BookUser className="mr-2 h-4 w-4" />
                      Personeller
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/management/locations" className="w-full flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      Lokasyonlar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/management/shift-templates" className="w-full flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Nöbet Şablonları
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/management/qualifications" className="w-full flex items-center">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Yetkinlikler
                    </Link>
                  </DropdownMenuItem>

                  {user?.roles.includes('ROLE_ADMIN') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Sistem Ayarları</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/management/rules" className="w-full flex items-center">
                          <GitBranch className="mr-2 h-4 w-4" />
                          Sistem Kuralları
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/management/audit-logs" className="w-full flex items-center">
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          Denetim Kayıtları
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="mr-2">{format(currentDateTime, 'dd MMMM yyyy', { locale: tr })}</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{format(currentDateTime, 'HH:mm:ss', { locale: tr })}</span>
            </div>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <CircleUserRound className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-1" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Hoş geldin,</p>
                    <p className="text-xs leading-none text-gray-700 font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile" className="w-full flex items-center">
                    <CircleUserRound className="mr-2 h-4 w-4" />
                    Profil Ayarları
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/notifications" className="w-full flex items-center">
                    <Bell className="mr-2 h-4 w-4" />
                    Tüm Bildirimler
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600 hover:!text-red-600 hover:!bg-red-50" onClick={handleLogout}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}