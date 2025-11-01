'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Member } from '@/services/memberService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMemberByUserId } from '@/services/memberService';
import { Loader2, PlusCircle, Send, Gavel, CalendarDays } from 'lucide-react'; // <-- İkonlar eklendi
import { CreateChangeRequestModal } from '@/components/CreateChangeRequestModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeaveRecordResponse } from '@/services/leaveRequestService';
import { CreateLeaveRequestModal } from '@/components/CreateLeaveRequestModal';
import { useReactToPrint } from 'react-to-print';
import { PrintableLeaveForm } from '@/components/PrintableLeaveForm';

import { ShiftChangeRequestsTab } from '@/components/ShiftChangeRequestsTab';
import { LeaveRequestsTab } from '@/components/LeaveRequestsTab';
import { BiddingRequestsTab } from '@/components/BiddingRequestsTab';
import { isFeatureEnabledAPI } from '@/services/featureFlagService';
import { cn } from '@/lib/utils';

function RequestsPageContent() {
  const { user } = useAuthStore();
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [isMemberLoading, setIsMemberLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("changeRequests");

  const [isCreateChangeModalOpen, setIsCreateChangeModalOpen] = useState(false);
  const [isCreateLeaveModalOpen, setIsCreateLeaveModalOpen] = useState(false);
  const [initiatingShiftId, setInitiatingShiftId] = useState<string | null>(null);

  const [recordToPrint, setRecordToPrint] = useState<LeaveRecordResponse | null>(null);
  const printComponentRef = useRef<HTMLDivElement | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [isBiddingEnabled, setIsBiddingEnabled] = useState(false);
  const [isFlagLoading, setIsFlagLoading] = useState(true);

  const isAdminOrScheduler = user?.roles.includes('ROLE_ADMIN') || user?.roles.includes('ROLE_SCHEDULER');

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    onAfterPrint: () => setRecordToPrint(null),
  });

  const triggerPrint = (record: LeaveRecordResponse) => {
    setRecordToPrint(record);
  };

  useEffect(() => {
    if (recordToPrint) {
      setTimeout(handlePrint, 100);
    }
  }, [recordToPrint, handlePrint]);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        setIsMemberLoading(true);
        setIsFlagLoading(true);
        try {
          const memberData = await getMemberByUserId(user.id);
          if (memberData) setCurrentMember(memberData);
        } catch (error) {
          console.error("Mevcut üye bilgisi alınamadı:", error);
        } finally {
          setIsMemberLoading(false);
        }

        try {
          const biddingFlag = await isFeatureEnabledAPI('ALLOW_SHIFT_BIDDING');
          setIsBiddingEnabled(biddingFlag);
        } catch {
          setIsBiddingEnabled(false);
        } finally {
          setIsFlagLoading(false);
        }
      } else {
        setIsMemberLoading(false);
        setIsFlagLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const initiate = searchParams.get('initiateChange');
    const shiftId = searchParams.get('shiftId');
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);

    if (initiate === 'true' && shiftId) {
      setInitiatingShiftId(shiftId);
      setIsCreateChangeModalOpen(true);
      router.replace('/requests' + (tab ? `?tab=${tab}` : ''), { scroll: false });
    }
  }, [searchParams, router]);

  if (isMemberLoading || isFlagLoading || !user) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }

  return (
    <>
      {/* Gizli yazdırma bileşeni */}
      <div style={{ display: "none" }}>
        <PrintableLeaveForm ref={printComponentRef} record={recordToPrint} />
      </div>

      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Talepler</h1>
          <Button
            onClick={() => setIsCreateLeaveModalOpen(true)}
            variant="default"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Yeni İzin Talebi
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* --- 1. KOŞULLU TabsList --- */}
          <TabsList className={cn(
            "grid w-full",
            isBiddingEnabled ? "grid-cols-3" : "grid-cols-2" // Borsa açıksa 3'lü, kapalıysa 2'li grid
          )}>
            <TabsTrigger value="changeRequests" className="flex items-center gap-2">
              <Send className="h-4 w-4" /> Nöbet Değişim
            </TabsTrigger>
            <TabsTrigger value="leaveRequests" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> İzin Talepleri
            </TabsTrigger>
            {/* Borsa özelliği açıksa, sekmesini göster */}
            {isBiddingEnabled && (
              <TabsTrigger value="bids" className="flex items-center gap-2">
                <Gavel className="h-4 w-4" /> Borsa Teklifleri
              </TabsTrigger>
            )}
          </TabsList>

          {/* --- 2. KOŞULLU TabsContent --- */}
          <TabsContent value="changeRequests">
            <ShiftChangeRequestsTab
              currentMember={currentMember}
            />
          </TabsContent>
          <TabsContent value="leaveRequests">
            <LeaveRequestsTab
              recordToPrint={recordToPrint}
              triggerPrint={triggerPrint}
            />
          </TabsContent>
          {/* Borsa özelliği açıksa, içeriğini göster */}
          {isBiddingEnabled && (
            <TabsContent value="bids">
              <BiddingRequestsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modallar ana sayfada kalır */}
      {
        initiatingShiftId && (
          <CreateChangeRequestModal
            isOpen={isCreateChangeModalOpen}
            onClose={() => setIsCreateChangeModalOpen(false)}
            onSuccess={() => {
              // Nöbet değişim talebi başarılıysa, ilgili sekmenin verisini yenile
              if (activeTab === 'changeRequests') {
                // Bu, yeniden fetch'i tetiklemek için basit bir yöntemdir.
                // Daha gelişmiş bir yöntem state management (Zustand/Context) kullanmaktır.
                window.location.reload();
              }
            }}
            initiatingShiftId={initiatingShiftId}
          />
        )
      }
      <CreateLeaveRequestModal
        isOpen={isCreateLeaveModalOpen}
        onClose={() => setIsCreateLeaveModalOpen(false)}
        onSuccess={() => {
          if (activeTab === 'leaveRequests') {
            window.location.reload();
          }
        }}
      />
    </>
  );
}

// Ana Suspense sarmalayıcısı
export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>}>
      <RequestsPageContent />
    </Suspense>
  );
}