'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Textarea eklendi
import { Switch } from "@/components/ui/switch"; // Switch eklendi
import { Location, LocationCreateRequest, LocationUpdateRequest, createLocation, updateLocation } from "@/services/locationService";
import { toast } from "sonner";

// Form doğrulama şeması
const formSchema = z.object({
  name: z.string().min(2, "Lokasyon adı en az 2 karakter olmalıdır.").max(100),
  description: z.string().max(500, "Açıklama en fazla 500 karakter olabilir.").optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface LocationFormProps {
  initialData?: Location | null; // Düzenleme için mevcut veriyi alır
  onSuccess: () => void;
}

export function LocationForm({ initialData, onSuccess }: LocationFormProps) {
  const isEditing = !!initialData; // Eğer initialData varsa düzenleme modundayız

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        name: initialData.name,
        description: initialData.description || "",
        isActive: initialData.isActive,
    } : {
        name: "", description: "", isActive: true,
    },
  });

  async function onSubmit(values: FormData) {
    try {
      if (isEditing) {
        const apiData: LocationUpdateRequest = { ...values };
        await updateLocation(initialData!.id, apiData);
        toast.success("Başarılı", { description: "Lokasyon başarıyla güncellendi." });
      } else {
        const apiData: LocationCreateRequest = {
            name: values.name,
            description: values.description || null,
        };
        await createLocation(apiData);
        toast.success("Başarılı", { description: "Lokasyon başarıyla eklendi." });
      }
      onSuccess(); // Formu kapat ve listeyi yenile
    } catch (error: any) {
      console.error("Lokasyon işlemi başarısız:", error);
      toast.error("Hata!", {
        description: error.response?.data?.message || `Lokasyon ${isEditing ? 'güncellenirken' : 'eklenirken'} bir hata oluştu.`,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Lokasyon Adı</FormLabel>
            <FormControl><Input placeholder="Acil Servis" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Açıklama (Opsiyonel)</FormLabel>
            <FormControl><Textarea placeholder="Lokasyon hakkında kısa bilgi..." className="resize-none" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {isEditing && ( // Sadece düzenleme modunda 'Aktif' seçeneğini göster
             <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Aktif</FormLabel>
                      <FormDescription>
                        Bu lokasyon sistemde aktif olarak kullanılsın mı?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
        )}
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? (isEditing ? 'Güncelleniyor...' : 'Ekleniyor...') : (isEditing ? 'Lokasyonu Güncelle' : 'Lokasyonu Ekle')}
        </Button>
      </form>
    </Form>
  );
}