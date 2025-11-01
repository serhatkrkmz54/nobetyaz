'use client';

import { useAuthStore } from "@/store/authStore";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hand, Bell, Send, Gavel, Settings, Info } from "lucide-react";

export function WelcomeModal() {
    // Store'dan state'leri al
    const user = useAuthStore((state) => state.user);
    const showOnboarding = useAuthStore((state) => state.showOnboarding);
    const clearOnboardingFlag = useAuthStore((state) => state.clearOnboardingFlag);

    if (!user) return null; // Kullanıcı yoksa render etme

    return (
        // State 'true' ise modalı göster
        <Dialog open={showOnboarding} onOpenChange={clearOnboardingFlag}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        <Hand className="h-8 w-8 text-yellow-400 inline-block mb-2" />
                        <br />
                        NöbetYaz'a Hoş Geldin, {user.firstName}!
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Sistemi kullanmaya başlamadan önce bilmen gereken birkaç ipucu:
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-start gap-3">
                        <Send className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-semibold">Nöbet Değişimi & İzin</h4>
                            <p className="text-sm text-muted-foreground">
                                <b>"Talepler"</b> sayfasından izin alabilir veya nöbetlerini değiştirebilirsin.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Gavel className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-semibold">Nöbet Borsası</h4>
                            <p className="text-sm text-muted-foreground">
                                <b>"Nöbet Borsası"</b> sayfasından boştaki nöbetlere talip olabilirsin.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Settings className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-semibold">Nöbet Tercihleri</h4>
                            <p className="text-sm text-muted-foreground">
                                <b>Profil</b> sayfandan hangi günler nöbet tutmak *istemediğini* belirtebilirsin.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-semibold">Yardım İpuçları</h4>
                            <p className="text-sm text-muted-foreground">
                                Sistemde gezerken, butonların yanında göreceğin <b className="text-cyan-600">(?)</b> ikonlarına tıklayarak yardım alabilirsin.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={clearOnboardingFlag} className="w-full">
                        Anladım, Başlayalım!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}