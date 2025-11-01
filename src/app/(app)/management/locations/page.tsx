'use client';

import { useEffect, useState } from 'react';
import { Location, getAllLocations, deleteLocation } from '@/services/locationService';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { LocationForm } from '@/components/LocationForm';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

export default function LocationManagementPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const data = await getAllLocations(true);
      setLocations(data);
    } catch (error) {
      console.error("Lokasyonlar yüklenemedi:", error);
      toast.error("Hata!", { description: "Lokasyonlar yüklenirken bir sorun oluştu." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
    fetchLocations();
  };

  const handleEditClick = (location: Location) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
      try {
          await deleteLocation(id);
          toast.success("Başarılı", { description: "Lokasyon silindi." });
          fetchLocations();
      } catch (error: any) {
          console.error("Lokasyon silinemedi:", error);
          toast.error("Hata!", { description: error.response?.data?.message || "Lokasyon silinirken bir hata oluştu." });
      } finally {
          setIsDeleting(null);
      }
  };

  const openNewForm = () => {
    setEditingLocation(null);
    setIsFormOpen(true);
  }

return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lokasyon Yönetimi</h1>
        <Button onClick={openNewForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Lokasyon Ekle
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {isLoading ? (
          <p className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></p>
        ) : (
          <Table>
            <TableCaption>Sistemdeki tüm lokasyonlar.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right w-[120px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{location.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={location.isActive ? "default" : "outline"} className={location.isActive ? "bg-green-100 text-green-800" : ""}>
                         {location.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(location)}
                      disabled={isDeleting === location.id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting === location.id}
                        >
                          {isDeleting === location.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{location.name}" lokasyonunu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(location.id)}>Sil</AlertDialogAction>
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
          if (!open) { setEditingLocation(null); }
          setIsFormOpen(open);
       }}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingLocation ? 'Lokasyonu Düzenle' : 'Yeni Lokasyon Ekle'}</DialogTitle>
              </DialogHeader>
              <LocationForm onSuccess={handleFormSuccess} initialData={editingLocation} />
          </DialogContent>
      </Dialog>
    </div>
  );
}