'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Member, MemberCreateRequest, MemberUpdateRequest, createMember, updateMember } from "@/services/memberService";
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch";
import { Qualification } from "@/services/qualificationService";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Terminal } from "lucide-react";
import { Label } from "./ui/label";

const formSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır.").max(50),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır.").max(50),
  phoneNumber: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  
  username: z.string().optional(),
  email: z.string().optional(),
  
  isActive: z.boolean(),
  userId: z.string().uuid().optional().nullable(),
  qualificationIds: z.array(z.string()).optional(),
}).refine((data) => {

    if (!data.id) { 
        if (!data.username || data.username.length < 3) return false;
        if (!data.email || !z.string().email().safeParse(data.email).success) return false;
    }
    return true;
}, {
    message: "Yeni personel eklerken Kullanıcı Adı (min 3), Email (geçerli) ve Şifre (min 6) alanları zorunludur.",
    path: ["username"],
});

type FormData = z.infer<typeof formSchema>;

interface MemberFormProps {
  initialData?: Member | null;
  onSuccess: () => void;
  allQualifications: Qualification[];
  // TODO: Kullanıcıları listelemek için props eklenebilir (userId seçimi için)
}

export function AddMemberForm({ initialData, onSuccess, allQualifications }: MemberFormProps) {
  const isEditing = !!initialData;

const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      id: initialData.id,
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        phoneNumber: initialData.phoneNumber || null,
        employeeId: initialData.employeeId || null,
        isActive: initialData.isActive,
        userId: initialData.userId || null,
        qualificationIds: initialData.qualifications?.map(q => q.id) || [],
        username: "",
        email: "",
    } : {
        id: null,
        firstName: "",
        lastName: "",
        phoneNumber: null,
        employeeId: null,
        isActive: true,
        userId: null,
        qualificationIds: [],
        username: "",
        email: "",
    },
  });

async function onSubmit(values: FormData) {
    try {
      if (isEditing) {
        const apiData: MemberUpdateRequest = {
            firstName: values.firstName,
            lastName: values.lastName,
            phoneNumber: values.phoneNumber || null,
            employeeId: values.employeeId || null,
            isActive: values.isActive,
            userId: values.userId || null,
            qualificationIds: values.qualificationIds || [],
           };
        await updateMember(initialData!.id, apiData);
        toast.success("Başarılı", { description: "Personel başarıyla güncellendi." });
      } else {
        const apiData: MemberCreateRequest = {
            firstName: values.firstName,
            lastName: values.lastName,
            phoneNumber: values.phoneNumber || null,
            employeeId: values.employeeId || null,
            username: values.username!,
            email: values.email!,
            roles: ["ROLE_VIEWER"],
           };
        const newMember = await createMember(apiData);
 if (newMember.invitationToken && newMember.username) {
            toast.success("Personel Oluşturuldu! Lütfen Bilgileri İletin:", {
              description: (
                <Alert variant="default" className="mt-2 bg-blue-50 border-blue-200">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Personel: {newMember.firstName} {newMember.lastName}</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>Personel, bu bilgilerle giriş yapıp ilk şifresini belirlemelidir.</p>
                    <div>
                      <Label className="text-xs">Kullanıcı Adı</Label>
                      <Input readOnly value={newMember.username} className="h-8 bg-white" />
                    </div>
                    <div>
                      <Label className="text-xs">Tek Kullanımlık PIN</Label>
                      <Input readOnly value={newMember.invitationToken} className="h-8 bg-white" />
                    </div>
                  </AlertDescription>
                </Alert>
              ),
              duration: 60000,
            });
        } else {
             toast.success("Başarılı", { description: "Personel ve kullanıcı hesabı başarıyla oluşturuldu." });
        }
      }
      onSuccess();
    } catch (error: any) {
      console.error("Personel işlemi başarısız:", error);
      toast.error("Hata!", {
        description: error.response?.data?.message || `Personel ${isEditing ? 'güncellenirken' : 'eklenirken'} bir hata oluştu.`,
      });
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Davet linki panoya kopyalandı!");
    }).catch(err => {
      console.error("Kopyalama başarısız:", err);
      toast.error("Kopyalama başarısız oldu.");
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>Ad</FormLabel>
              <FormControl><Input placeholder="Ahmet" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Soyad</FormLabel>
              <FormControl><Input placeholder="Yılmaz" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
           <FormItem>
             <FormLabel>Telefon (Opsiyonel)</FormLabel>
             <FormControl><Input type="tel" placeholder="5551234567" {...field} value={field.value ?? ""} /></FormControl>
             <FormMessage />
           </FormItem>
        )} />
        <FormField control={form.control} name="employeeId" render={({ field }) => (
          <FormItem>
            <FormLabel>Personel No (Opsiyonel)</FormLabel>
            <FormControl><Input placeholder="PN12345" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
{!isEditing && (
          <div className="space-y-4 rounded-md border p-4">
            <h4 className="font-medium">Kullanıcı Hesabı Bilgileri (Zorunlu)</h4>
            <p className="text-xs text-muted-foreground">
              Personel için bir kullanıcı hesabı oluşturulacak. 
              Sistem, personele göndermeniz için tek kullanımlık bir şifre belirleme linki üretecektir.
            </p>
             <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem><FormLabel>Kullanıcı Adı *</FormLabel><FormControl><Input placeholder="personel.kullaniciadi" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" placeholder="personel@sirket.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        )}
        {isEditing && (
             <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Aktif</FormLabel>
                      <FormDescription>Bu personel sistemde aktif mi?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
        )}
        {isEditing && (
          <div>
            <FormLabel>Yetkinlikler</FormLabel>
            <FormDescription>Bu personele atanmış yetkinlikleri seçin.</FormDescription>
            <div className="grid grid-cols-2 gap-2 mt-2 rounded-md border p-4 max-h-[200px] overflow-y-auto">
              {allQualifications.map((qualification) => (
                <FormField
                  key={qualification.id}
                  control={form.control}
                  name="qualificationIds"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={qualification.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(qualification.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), qualification.id])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== qualification.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">{qualification.name}</FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
           {form.formState.isSubmitting ? (isEditing ? 'Güncelleniyor...' : 'Ekleniyor...') : (isEditing ? 'Personeli Güncelle' : 'Personeli Ekle')}
        </Button>
      </form>
    </Form>
  );
}