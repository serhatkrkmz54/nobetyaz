'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Checkbox eklendi
import { Label } from "@/components/ui/label";     // Label eklendi
import { ShiftTemplate, ShiftTemplateCreateRequest, ShiftTemplateUpdateRequest, createShiftTemplate, updateShiftTemplate } from "@/services/shiftTemplateService";
import { toast } from "sonner";
import { useEffect } from "react";

// HH:MM:SS formatını doğrulayan regex
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

// Haftanın günleri için sabitler
const days = [
    { id: 'MONDAY', label: 'Pazartesi' }, { id: 'TUESDAY', label: 'Salı' },
    { id: 'WEDNESDAY', label: 'Çarşamba' }, { id: 'THURSDAY', label: 'Perşembe' },
    { id: 'FRIDAY', label: 'Cuma' }, { id: 'SATURDAY', label: 'Cumartesi' },
    { id: 'SUNDAY', label: 'Pazar' }
] as const; // Readonly tuple

// Form doğrulama şeması
const formSchema = z.object({
  name: z.string().min(2, "Şablon adı en az 2 karakter olmalıdır.").max(100),
  startTime: z.string().regex(timeRegex, "Saat HH:MM:SS formatında olmalıdır (örn: 08:00:00)."),
  endTime: z.string().regex(timeRegex, "Saat HH:MM:SS formatında olmalıdır (örn: 16:00:00)."),
  isNightShift: z.boolean(), // .default(false) kaldırıldı. Artık sadece boolean bekliyor.
  daysOfWeek: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ShiftTemplateFormProps {
  initialData?: ShiftTemplate | null;
  onSuccess: () => void;
}

export function ShiftTemplateForm({ initialData, onSuccess }: ShiftTemplateFormProps) {
  const isEditing = !!initialData;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        name: initialData.name,
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        isNightShift: initialData.isNightShift,
        daysOfWeek: initialData.daysOfWeek?.split(',') || [],
    } : {
        name: "", startTime: "08:00:00", endTime: "16:00:00", isNightShift: false, daysOfWeek: [],
    },
  });

  // Zod şeması gün seçimini direct olarak handle etmediği için manuel kontrol
  useEffect(() => {
      form.register("daysOfWeek"); // react-hook-form'a alanı tanıt
  }, [form.register]);


  async function onSubmit(values: FormData) {
    // Seçilen günleri virgülle ayrılmış string'e dönüştür
    const daysOfWeekString = values.daysOfWeek && values.daysOfWeek.length > 0 ? values.daysOfWeek.join(',') : null;

    try {
      if (isEditing) {
        const apiData: ShiftTemplateUpdateRequest = {
            name: values.name,
            startTime: values.startTime,
            endTime: values.endTime,
            isNightShift: values.isNightShift,
            daysOfWeek: daysOfWeekString,
         };
        await updateShiftTemplate(initialData!.id, apiData);
        toast.success("Başarılı", { description: "Nöbet şablonu başarıyla güncellendi." });
      } else {
        const apiData: ShiftTemplateCreateRequest = {
            name: values.name,
            startTime: values.startTime,
            endTime: values.endTime,
            isNightShift: values.isNightShift,
            daysOfWeek: daysOfWeekString,
         };
        await createShiftTemplate(apiData);
        toast.success("Başarılı", { description: "Nöbet şablonu başarıyla eklendi." });
      }
      onSuccess();
    } catch (error: any) {
      console.error("Nöbet şablonu işlemi başarısız:", error);
      toast.error("Hata!", {
        description: error.response?.data?.message || `Nöbet şablonu ${isEditing ? 'güncellenirken' : 'eklenirken'} bir hata oluştu.`,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Şablon Adı</FormLabel><FormControl><Input placeholder="Gündüz Nöbeti (Hafta İçi)" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="startTime" render={({ field }) => (
            <FormItem><FormLabel>Başlangıç Saati</FormLabel><FormControl><Input type="time" step="1" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="endTime" render={({ field }) => (
            <FormItem><FormLabel>Bitiş Saati</FormLabel><FormControl><Input type="time" step="1" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
         <FormField control={form.control} name="isNightShift" render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Gece Nöbeti mi?</FormLabel>
                  <FormDescription>Eğer bitiş saati ertesi güne sarkıyorsa işaretleyin.</FormDescription>
                </div>
              </FormItem>
          )} />

        <div>
          <FormLabel>Geçerli Günler</FormLabel>
          <div className="grid grid-cols-3 gap-2 mt-2 rounded-md border p-3">
            {days.map((day) => (
              <FormField
                key={day.id}
                control={form.control}
                name="daysOfWeek"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={day.id}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(day.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), day.id])
                              : field.onChange(
                                  (field.value || []).filter(
                                    (value) => value !== day.id
                                  )
                                )
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">{day.label}</FormLabel>
                    </FormItem>
                  )
                }}
              />
            ))}
          </div>
           <FormDescription className="mt-1 text-xs">Hiçbir gün seçilmezse şablon her gün geçerli olur.</FormDescription>
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
           {form.formState.isSubmitting ? (isEditing ? 'Güncelleniyor...' : 'Ekleniyor...') : (isEditing ? 'Şablonu Güncelle' : 'Şablonu Ekle')}
        </Button>
      </form>
    </Form>
  );
}