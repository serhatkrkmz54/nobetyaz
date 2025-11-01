'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from "@/store/authStore";
import { Loader2, UserCircle, Lock, Settings } from "lucide-react";
import { ProfileUpdateForm } from "@/components/ProfileUpdateForm";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isFeatureEnabledAPI } from '@/services/featureFlagService';
import { MemberPreferenceForm } from '@/components/MemberPreferenceForm';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [isPreferenceTabVisible, setIsPreferenceTabVisible] = useState(false);
  const [isFlagLoading, setIsFlagLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    isFeatureEnabledAPI('ALLOW_MEMBER_PREFERENCES')
      .then(isEnabled => setIsPreferenceTabVisible(isEnabled))
      .finally(() => setIsFlagLoading(false));
  }, []);

  if (isLoading || isFlagLoading || !user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)] bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 py-10">
      {/* 🔹 max-w-6xl (önceden 5xl) */}
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-800">
            Profil Ayarları
          </h1>
          <p className="text-slate-500 mt-2">
            Hesabınızı yönetin, bilgilerinizi güncelleyin ve tercihlerinizi belirleyin.
          </p>
        </div>

        {/* 🔹 Kart genişliği daha ferah, padding artırıldı */}
        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/90">
          <CardContent className="p-10 md:p-12">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList
                className={cn(
                  "grid mb-10 rounded-xl bg-slate-100/80 backdrop-blur-sm",
                  isPreferenceTabVisible ? "grid-cols-3" : "grid-cols-2"
                )}
              >
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <UserCircle className="h-4 w-4" />
                  Kişisel Bilgiler
                </TabsTrigger>

                <TabsTrigger
                  value="password"
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <Lock className="h-4 w-4" />
                  Şifre Değiştir
                </TabsTrigger>

                {isPreferenceTabVisible && (
                  <TabsTrigger
                    value="preferences"
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                  >
                    <Settings className="h-4 w-4" />
                    Nöbet Tercihlerim
                  </TabsTrigger>
                )}
              </TabsList>

              <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle>Kişisel Bilgiler</CardTitle>
                        <CardDescription>
                          Adınızı, soyadınızı ve iletişim bilgilerinizi güncelleyin.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ProfileUpdateForm currentUser={user} />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === "password" && (
                  <motion.div
                    key="password"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle>Şifre Değiştir</CardTitle>
                        <CardDescription>
                          Güvenliğiniz için düzenli olarak şifrenizi değiştirin.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChangePasswordForm />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === "preferences" && isPreferenceTabVisible && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle>Nöbet Tercihlerim</CardTitle>
                        <CardDescription>
                          Hangi gün ve saatlerde nöbet tutmayı tercih ettiğinizi (veya istemediğinizi) belirtin.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <MemberPreferenceForm />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
