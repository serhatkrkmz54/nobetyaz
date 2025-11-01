'use client';
import { LeaveRequest } from "@/services/leaveService";
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface LeaveRequestPDFProps {
  leaveRequest: LeaveRequest;
}

export function LeaveRequestPDF({ leaveRequest }: LeaveRequestPDFProps) {
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd MMMM yyyy, EEEE', { locale: tr });
  };
  const today = format(new Date(), 'dd.MM.yyyy');

  return (
    <div className="p-8 font-serif text-black">
      <header className="text-center mb-12">
        <h1 className="text-2xl font-bold">PERSONEL İZİN TALEP FORMU</h1>
        <p className="text-sm">Belge Tarihi: {today}</p>
      </header>

      <section className="mb-8">
        <h2 className="text-lg font-semibold border-b pb-1 mb-4">TALEP EDEN PERSONEL BİLGİLERİ</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-gray-600">ADI SOYADI</p>
            <p className="text-md font-medium">{leaveRequest.member.firstName} {leaveRequest.member.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">PERSONEL NO</p>
            <p className="text-md font-medium">{leaveRequest.member.employeeId || 'Belirtilmemiş'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">TELEFON NUMARASI</p>
            <p className="text-md font-medium">{leaveRequest.member.phoneNumber || 'Belirtilmemiş'}</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold border-b pb-1 mb-4">TALEP EDİLEN İZİN BİLGİLERİ</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-gray-600">İZİN TÜRÜ</p>
            <p className="text-md font-medium">{leaveRequest.leaveType}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">İZİN DURUMU</p>
            <p className="text-md font-medium text-green-700">ONAYLANDI</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">İZİN BAŞLANGIÇ TARİHİ</p>
            <p className="text-md font-medium">{formatDate(leaveRequest.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">İZİN BİTİŞ TARİHİ</p>
            <p className="text-md font-medium">{formatDate(leaveRequest.endDate)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-600">İZİN SEBEBİ / AÇIKLAMA</p>
            <p className="text-md font-medium">{leaveRequest.reason || 'Açıklama belirtilmemiş.'}</p>
          </div>
        </div>
      </section>

      <footer className="mt-20">
        <p className="text-sm">İşbu form, {today} tarihinde NöbetYaz otomasyon sistemi üzerinden oluşturulmuştur.</p>
        <div className="flex justify-between mt-12 pt-8 border-t">
          <div className="text-center">
            <p>.......................................</p>
            <p className="font-semibold">Personel İmza</p>
            <p className="text-sm">({leaveRequest.member.firstName} {leaveRequest.member.lastName})</p>
          </div>
          <div className="text-center">
            <p>.......................................</p>
            <p className="font-semibold">Yönetici / İK Onayı</p>
          </div>
        </div>
      </footer>
    </div>
  );
}