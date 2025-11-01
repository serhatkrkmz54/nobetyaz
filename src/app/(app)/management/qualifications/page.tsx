'use client';

import { useEffect, useState } from 'react';
import { Qualification, getAllQualifications, deleteQualification } from '@/services/qualificationService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QualificationForm } from '@/components/QualificationForm'; // Yeni formu import et
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function QualificationManagementPage() {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);

  const fetchQualifications = async () => {
    setIsLoading(true);
    try {
      const data = await getAllQualifications();
      setQualifications(data);
    } catch (error) {
      toast.error("Hata!", { description: "Yetkinlikler yüklenirken bir sorun oluştu." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQualifications();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingQualification(null);
    fetchQualifications();
  };

  const handleEditClick = (qualification: Qualification) => {
    setEditingQualification(qualification);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
      try {
          await deleteQualification(id);
          toast.success("Başarılı", { description: "Yetkinlik silindi." });
          fetchQualifications();
      } catch (error: any) {
          toast.error("Hata!", { description: error.response?.data?.message || "Yetkinlik silinirken bir hata oluştu." });
      }
  };

  const openNewForm = () => {
    setEditingQualification(null);
    setIsFormOpen(true);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Yetkinlik Yönetimi</h1>
        <Button onClick={openNewForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Yetkinlik Ekle
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {isLoading ? (<p>Yetkinlikler yükleniyor...</p>) : (
          <Table>
            <TableCaption>Sistemdeki tüm personel yetkinlikleri.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualifications.map((qualification) => (
                <TableRow key={qualification.id}>
                  <TableCell className="font-medium">{qualification.name}</TableCell>
                  <TableCell>{qualification.description || '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(qualification)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>Bu yetkinliği silmek istediğinizden emin misiniz?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(qualification.id)}>Sil</AlertDialogAction>
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

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingQualification(null); }}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingQualification ? 'Yetkinliği Düzenle' : 'Yeni Yetkinlik Ekle'}</DialogTitle>
              </DialogHeader>
              <QualificationForm onSuccess={handleFormSuccess} initialData={editingQualification} />
          </DialogContent>
      </Dialog>
    </div>
  );
}