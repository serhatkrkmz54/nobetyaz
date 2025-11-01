'use client';

import React from 'react';
import { LeaveRecordResponse } from '@/services/leaveRequestService';

const LEAVE_TYPE_MAP: Record<string, string> = {
  "ANNUAL_LEAVE": "Yıllık İzin",
  "SICK_LEAVE": "Hastalık İzni (Raporlu)",
  "UNPAID_LEAVE": "Ücretsiz İzin",
  "OTHER": "Diğer Mazeret İzni",
};
const getLeaveTypeLabel = (key: string): string => LEAVE_TYPE_MAP[key] || key;

interface PrintableLeaveFormProps {
  record: LeaveRecordResponse | null;
}

export const PrintableLeaveForm = React.forwardRef<HTMLDivElement, PrintableLeaveFormProps>(({ record }, ref) => {

  if (!record) return null;

  const leaveTypeLabel = getLeaveTypeLabel(record.leaveType);
  const statusLabel = record.status === 'APPROVED' ? 'ONAYLANMIŞTIR' : 'BEKLEMEDE';
  const startDate = new Date(record.startDate).toLocaleDateString('tr-TR', { dateStyle: 'long' });
  const endDate = new Date(record.endDate).toLocaleDateString('tr-TR', { dateStyle: 'long' });

  return (
    <div ref={ref} className="p-10 text-black bg-white">

      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 20mm; }
          body { -webkit-print-color-adjust: exact; color-adjust: exact; }
        `}
      </style>

      <h1 className="text-2xl font-bold text-center mb-10">PERSONEL İZİN FORMU</h1>

      <div className="space-y-4 text-base">
        <p><strong>Personel Adı Soyadı:</strong> {record.memberFirstName} {record.memberLastName}</p>
        <hr className="my-2 border-gray-300"/>
        <p><strong>İzin Türü:</strong> {leaveTypeLabel}</p>
        <p><strong>Başlangıç Tarihi:</strong> {startDate}</p>
        <p><strong>Bitiş Tarihi:</strong> {endDate}</p>
        <p><strong>Sebep:</strong> {record.reason || "Belirtilmedi"}</p>
        <hr className="my-2 border-gray-300"/>
        <p><strong>Talep Durumu:</strong> 
          <span className="font-bold ml-2 p-2 bg-green-100 text-green-800 border border-green-300 rounded-md">
            {statusLabel}
          </span>
        </p>
      </div>

      <div className="flex justify-between mt-24 pt-10 border-t border-gray-300">
        <div className="text-center">
          <p>(Personel İmzası)</p>
          <p className="mt-8">_________________</p>
        </div>
        <div className="text-center">
          <p>(Yönetici İmzası)</p>
          <p className="mt-8">_________________</p>
        </div>
      </div>
    </div>
  );
});

PrintableLeaveForm.displayName = "PrintableLeaveForm";