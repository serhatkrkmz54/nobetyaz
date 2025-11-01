'use client';

import { useEffect, useState } from 'react';
import { Member, getAllMembers, deleteMember, resendInvitationAPI } from '@/services/memberService';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
// Form bileşeninizin adının 'MemberForm' olduğunu varsayıyorum
import { AddMemberForm } from '@/components/AddMemberForm'; 
// Gerekli yeni importlar: 'Eye' ikonu ve 'Popover'
import { PlusCircle, Edit, Trash2, Loader2, Terminal, Copy, Send, KeyRound, Eye } from 'lucide-react'; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { getAllQualifications, Qualification } from '@/services/qualificationService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MemberManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [isResending, setIsResending] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const [membersData, qualificationsData] = await Promise.all([
        getAllMembers(),
        getAllQualifications()
      ]);
      setMembers(membersData);
      setQualifications(qualificationsData);
    } catch (error) {
      console.error("Personeller yüklenemedi:", error);
      toast.error("Hata!", { description: "Personeller yüklenirken bir hata oluştu." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingMember(null);
    fetchMembers();
  };

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
      setIsDeleting(id);
      try {
          await deleteMember(id);
          toast.success("Başarılı", { description: "Personel başarıyla silindi." });
          fetchMembers();
      } catch (error: any) {
          console.error("Personel silinemedi:", error);
          toast.error("Hata!", { description: error.response?.data?.message || "Personel silinirken bir hata oluştu." });
      } finally {
          setIsDeleting(null);
      }
  };

  const openNewForm = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  }

  const copyToClipboard = (text: string, type: 'PIN' | 'Kullanıcı Adı') => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} panoya kopyalandı!`);
    }).catch(err => {
      toast.error("Kopyalama başarısız oldu.");
    });
  };

  const handleResendInvitation = async (member: Member) => {
    setIsResending(member.id);
    try {
      const updatedMember = await resendInvitationAPI(member.id);
      const newPin = updatedMember.invitationToken;
      const username = updatedMember.username;

      if (!newPin || !username) {
        throw new Error("Backend'den yeni PIN veya kullanıcı adı gelmedi.");
      }
      
      // Yeni PIN'i toast ile göster
      toast.success("Yeni PIN Oluşturuldu!", {
          description: (
            <Alert variant="default" className="mt-2 bg-blue-50 border-blue-200">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Yeni Aktivasyon Bilgileri: {updatedMember.firstName}</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>Yeni PIN 24 saat geçerlidir. Lütfen personele iletin.</p>
                <div>
                  <Label className="text-xs">Kullanıcı Adı</Label>
                  <Input readOnly value={username} className="h-8 bg-white" />
                </div>
                <div>
                  <Label className="text-xs">Yeni 6 Haneli PIN</Label>
                  <Input readOnly value={newPin} className="h-8 bg-white" />
                </div>
              </AlertDescription>
            </Alert>
          ),
          duration: 60000,
      });
      fetchMembers(); // Listeyi (yeni PIN ile) yenile
      
    } catch (error: any) {
        toast.error("Hata!", { description: error.response?.data?.message || "Yeni PIN oluşturulurken bir hata oluştu." });
    } finally {
        setIsResending(null);
    }
  };

  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'AKTIF': return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Aktif</Badge>;
      case 'DAVET_BEKLIYOR': return <Badge variant="secondary">Davet Bekliyor</Badge>;
      case 'SURESI_DOLMUS': return <Badge variant="destructive">Süresi Dolmuş</Badge>;
      case 'HESAP_YOK': return <Badge variant="outline">Hesap Yok (Eski Kayıt)</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Personel Yönetimi</h1>
        <Button onClick={openNewForm}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Personel Ekle
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {isLoading ? (
          <p className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></p>
        ) : (
          <Table>
            <TableCaption>Sistemdeki tüm personellerin listesi.</TableCaption>
            
            {/* ✅ DÜZELTME: Sütun başlıkları, gövde ile eşleşecek şekilde güncellendi */}
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad / Kullanıcı Adı</TableHead>
                <TableHead>Yetkinlikler</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Personel Durumu</TableHead>
                <TableHead>Hesap Durumu</TableHead>
                <TableHead className="text-right w-[180px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  {/* ✅ DÜZELTME: Sütunların sırası başlıkla eşleşti */}
                  <TableCell className="font-medium">
                    {member.firstName} {member.lastName}
                    {member.username && (
                        <p className="text-xs text-muted-foreground font-mono">{member.username}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {member.qualifications?.map(q => q.name).join(', ') || '-'}
                  </TableCell>
                  <TableCell>{member.phoneNumber || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "default" : "outline"} className={member.isActive ? "bg-green-100 text-green-800" : ""}>
                         {member.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getUserStatusBadge(member.userStatus)}
                  </TableCell>
                  
                  {/* --- İşlemler Sütunu --- */}
                  <TableCell className="text-right space-x-2">
                    
                    {/* ✅ YENİ ÖZELLİK: "PIN Göster" Butonu (Popover ile) */}
                    {member.userStatus === 'DAVET_BEKLIYOR' && member.invitationToken && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Aktivasyon bilgilerini göster"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4" align="end">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Aktivasyon Bilgileri</h4>
                            <div>
                              <Label className="text-xs font-semibold">Kullanıcı Adı</Label>
                              <p className="font-mono text-sm">{member.username}</p>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold">6 Haneli PIN</Label>
                              <p className="font-mono text-lg text-primary">{member.invitationToken}</p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    
                    {/* "PIN Kopyala" Butonu */}
                    {member.userStatus === 'DAVET_BEKLIYOR' && member.invitationToken && (
                        <Button
                            variant="outline"
                            size="sm"
                            title="Aktivasyon PIN'ini Kopyala"
                            onClick={() => copyToClipboard(member.invitationToken!, 'PIN')}
                        >
                            <KeyRound className="h-4 w-4" />
                        </Button>
                    )}
                    
                    {/* "Yeni PIN Gönder" Butonu */}
                    {member.userStatus === 'SURESI_DOLMUS' && (
                        <Button
                            variant="outline"
                            size="sm"
                            title="Yeni PIN Oluştur"
                            disabled={isResending === member.id}
                            onClick={() => handleResendInvitation(member)}
                        >
                            {isResending === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    )}

                    {/* Düzenle Butonu (Aynı) */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(member)}
                      disabled={isDeleting === member.id || isResending === member.id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    {/* Sil Butonu (Aynı) */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting === member.id}
                        >
                          {isDeleting === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{member.firstName} {member.lastName}" adlı personeli kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(member.id)}>Sil</AlertDialogAction>
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

      {/* Dialog (Aynı) */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (!open) { setEditingMember(null); }
          setIsFormOpen(open);
        }}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{editingMember ? 'Personeli Düzenle' : 'Yeni Personel Ekle'}</DialogTitle>
              </DialogHeader>
              <AddMemberForm onSuccess={handleFormSuccess} initialData={editingMember} allQualifications={qualifications} />
          </DialogContent>
      </Dialog>
    </div>
  );
}