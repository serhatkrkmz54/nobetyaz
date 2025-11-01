'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { LeaveRequest } from '@/services/leaveService';
import { LeaveRequestPDF } from '@/components/LeaveRequestPDF';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintLeaveButtonProps {
  leaveRequest: LeaveRequest;
}

export function PrintLeaveButton({ leaveRequest }: PrintLeaveButtonProps) {
  const printComponentRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Izin-Talep-${leaveRequest.member.firstName}-${leaveRequest.member.lastName}`,
    onAfterPrint: () => console.log('İzin kağıdı yazdırıldı.'),
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePrint} title="İzin Kağıdını Yazdır">
        <Printer className="h-4 w-4" />
      </Button>
      <div style={{ display: 'none' }}>
        <div ref={printComponentRef}>
          <LeaveRequestPDF leaveRequest={leaveRequest} />
        </div>
      </div>
    </>
  );
}