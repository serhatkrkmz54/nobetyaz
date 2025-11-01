'use client';

import { useEffect, useState } from 'react';
import { ShiftRequirement, getRequirements, deleteRequirement } from '@/services/shiftRequirementService';
import { Location, getAllLocations } from '@/services/locationService';
import { ShiftTemplate, getAllShiftTemplates } from '@/services/shiftTemplateService';
import { Qualification, getAllQualifications } from '@/services/qualificationService';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShiftRequirementForm } from '@/components/ShiftRequirementForm';
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DAY_TYPE_LABELS, DayType } from '@/lib/constants';

export default function RequirementManagementPage() {

  const [locations, setLocations] = useState<Location[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<ShiftRequirement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingData(true);
      try {
        const [locData, tmplData, qualData] = await Promise.all([
          getAllLocations(),
          getAllShiftTemplates(),
          getAllQualifications()
        ]);
        setLocations(locData);
        setShiftTemplates(tmplData);
        setQualifications(qualData);
      } catch {
        toast.error("Hata!", { description: "Gerekli veriler yüklenemedi." });
      } finally {
        setIsLoadingData(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedLocationId && selectedTemplateId) {
      fetchRequirements(selectedLocationId, selectedTemplateId);
    } else {
      setRequirements([]);
    }
  }, [selectedLocationId, selectedTemplateId]);

  const fetchRequirements = async (locId: string, tmplId: string) => {
    setIsLoadingRequirements(true);
    try {
      const data = await getRequirements(locId, tmplId);
      setRequirements(data);
    } catch (error) {
      toast.error("Hata!", { description: "Nöbet gereksinimleri yüklenirken bir sorun oluştu." });
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    if (selectedLocationId && selectedTemplateId) {
      fetchRequirements(selectedLocationId, selectedTemplateId);
    }
  };

  const handleDelete = async (id: string) => {
      try {
          await deleteRequirement(id);
          toast.success("Başarılı", { description: "Gereksinim silindi." });
          if (selectedLocationId && selectedTemplateId) {
             fetchRequirements(selectedLocationId, selectedTemplateId);
          }
      } catch (error: any) {
          toast.error("Hata!", { description: error.response?.data?.message || "Gereksinim silinirken bir hata oluştu." });
      }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nöbet Gereksinimi Yönetimi</h1>
        <Button onClick={() => setIsFormOpen(true)} disabled={isLoadingData}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Gereksinim Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select onValueChange={setSelectedLocationId} disabled={isLoadingData}>
              <SelectTrigger><SelectValue placeholder="Önce bir lokasyon seçin..." /></SelectTrigger>
              <SelectContent>
                  {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
              </SelectContent>
          </Select>
          <Select onValueChange={setSelectedTemplateId} disabled={isLoadingData || !selectedLocationId}>
               <SelectTrigger><SelectValue placeholder="Sonra bir nöbet şablonu seçin..." /></SelectTrigger>
               <SelectContent>
                   {shiftTemplates.map(tmpl => <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</SelectItem>)}
               </SelectContent>
          </Select>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {(isLoadingData || isLoadingRequirements) ? (<p>Yükleniyor...</p>) :
         (selectedLocationId && selectedTemplateId) ? (
          <Table>
            <TableCaption>Seçilen lokasyon ve şablon için gereken personel.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Yetkinlik</TableHead>
                <TableHead>Gereken Sayı</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.qualificationName}</TableCell>
                  <TableCell className="text-sm">
                    {DAY_TYPE_LABELS[req.applyOn as DayType] || req.applyOn}
                  </TableCell>
                  <TableCell>{req.requiredMemberCount}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>Bu gereksinimi silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(req.id)}>Sil</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : ( <p className="text-center text-muted-foreground p-4">Gereksinimleri görmek için lütfen bir lokasyon ve nöbet şablonu seçin.</p> )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Yeni Nöbet Gereksinimi Ekle</DialogTitle></DialogHeader>
              <ShiftRequirementForm
                locations={locations}
                shiftTemplates={shiftTemplates}
                qualifications={qualifications}
                onSuccess={handleFormSuccess}
              />
          </DialogContent>
      </Dialog>
    </div>
  );
}