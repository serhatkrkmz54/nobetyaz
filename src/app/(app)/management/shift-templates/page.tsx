'use client';

import { useEffect, useState } from 'react';
import { ShiftTemplate, getAllShiftTemplates, deleteShiftTemplate } from '@/services/shiftTemplateService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShiftTemplateForm } from '@/components/ShiftTemplateForm'; // Yeni formu import et
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ShiftTemplateManagementPage() {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await getAllShiftTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error("Hata!", { description: "Nöbet şablonları yüklenirken bir sorun oluştu." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const handleEditClick = (template: ShiftTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
      try {
          await deleteShiftTemplate(id);
          toast.success("Başarılı", { description: "Nöbet şablonu silindi." });
          fetchTemplates();
      } catch (error: any) {
          toast.error("Hata!", { description: error.response?.data?.message || "Nöbet şablonu silinirken bir hata oluştu." });
      } finally {
          setIsDeleting(null);
      }
  };

  const openNewForm = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  }

return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nöbet Şablonu Yönetimi</h1>
        <Button onClick={openNewForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Şablon Ekle
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {isLoading ? (
          <p className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></p>
        ) : (
          <Table>
            <TableCaption>Sistemdeki tüm nöbet şablonları.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Saatler (Süre)</TableHead>
                <TableHead>Günler</TableHead>
                <TableHead>Gece Nöbeti</TableHead>
                <TableHead className="text-right w-[120px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    {template.startTime.substring(0, 5)} - {template.endTime.substring(0, 5)}
                    <span className="text-xs text-muted-foreground ml-2">({template.durationInHours.toFixed(1)} sa)</span>
                  </TableCell>
                  <TableCell className="text-xs">{template.daysOfWeek?.replaceAll(',', ', ') || 'Her Gün'}</TableCell>
                  <TableCell>{template.isNightShift ? 'Evet' : 'Hayır'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(template)}
                      disabled={isDeleting === template.id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting === template.id}
                        >
                          {isDeleting === template.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{template.name}" şablonunu kalıcı olarak silmek istediğinizden emin misiniz? Bu şablonu kullanan Nöbet Gereksinimleri varsa silme işlemi başarısız olabilir.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(template.id)}>Sil</AlertDialogAction>
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

      <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (!open) { setEditingTemplate(null); }
          setIsFormOpen(open);
       }}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingTemplate ? 'Şablonu Düzenle' : 'Yeni Nöbet Şablonu Ekle'}</DialogTitle>
              </DialogHeader>
              <ShiftTemplateForm onSuccess={handleFormSuccess} initialData={editingTemplate} />
          </DialogContent>
      </Dialog>
    </div>
  );
}