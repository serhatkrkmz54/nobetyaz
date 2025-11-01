'use client';

import { useEffect, useState } from 'react';
import { Holiday, getAllHolidays, deleteHoliday } from '@/services/holidayService';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { HolidayForm } from '@/components/HolidayForm';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DAY_TYPE_LABELS } from '@/lib/constants';

export default function HolidayManagementPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const data = await getAllHolidays();
      setHolidays(data);
    } catch (error) {
      toast.error("Hata!", { description: "Tatil kayıtları yüklenirken bir sorun oluştu." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingHoliday(null);
    fetchHolidays();
  };

  const handleEditClick = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
      setIsDeleting(id);
      try {
          await deleteHoliday(id);
          toast.success("Başarılı", { description: "Tatil kaydı silindi." });
          fetchHolidays();
      } catch (error: any) {
          toast.error("Hata!", { description: "Tatil kaydı silinirken bir hata oluştu." });
      } finally {
          setIsDeleting(null);
      }
  };

  const openNewForm = () => {
    setEditingHoliday(null);
    setIsFormOpen(true);
  };

  const formatDate = (dateString: string) => {
      return format(parseISO(dateString), 'dd MMMM yyyy, EEEE', { locale: tr });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tatil ve Özel Gün Yönetimi</h1>
        <Button onClick={openNewForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kayıt Ekle
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {isLoading ? (
          <p className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></p>
        ) : (
          <Table>
            <TableCaption>Sistemde tanımlı tüm tatiller ve özel günler.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>Tipi</TableHead>
                <TableHead className="text-right w-[120px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">{formatDate(holiday.holidayDate)}</TableCell>
                  <TableCell>{holiday.name}</TableCell>
                  <TableCell>
                    {DAY_TYPE_LABELS[holiday.holidayType] || holiday.holidayType}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(holiday)} disabled={isDeleting === holiday.id}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting === holiday.id}>
                          {isDeleting === holiday.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>"{holiday.name}" kaydını silmek istediğinizden emin misiniz?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(holiday.id)}>Sil</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) setEditingHoliday(null); setIsFormOpen(open); }}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingHoliday ? 'Kaydı Düzenle' : 'Yeni Tatil/Özel Gün Ekle'}</DialogTitle>
              </DialogHeader>
              <HolidayForm onSuccess={handleFormSuccess} initialData={editingHoliday} />
          </DialogContent>
      </Dialog>
    </div>
  );
}