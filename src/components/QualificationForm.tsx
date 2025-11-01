'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Qualification, QualificationCreateRequest, QualificationUpdateRequest, createQualification, updateQualification } from "@/services/qualificationService";
import { toast } from "sonner";

// Form doğrulama şeması
const formSchema = z.object({
  name: z.string().min(2, "Yetkinlik adı en az 2 karakter olmalıdır.").max(100),
  description: z.string().max(500, "Açıklama en fazla 500 karakter olabilir.").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface QualificationFormProps {
  initialData?: Qualification | null; // Düzenleme için
  onSuccess: () => void;
}

export function QualificationForm({ initialData, onSuccess }: QualificationFormProps) {
  const isEditing = !!initialData;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        name: initialData.name,
        description: initialData.description || "",
    } : {
        name: "", description: "",
    },
  });

  async function onSubmit(values: FormData) {
    try {
      if (isEditing) {
        const apiData: QualificationUpdateRequest = { ...values };
        await updateQualification(initialData!.id, apiData);
        toast.success("Başarılı", { description: "Yetkinlik başarıyla güncellendi." });
      } else {
        const apiData: QualificationCreateRequest = {
            name: values.name,
            description: values.description || null,
        };
        await createQualification(apiData);
        toast.success("Başarılı", { description: "Yetkinlik başarıyla eklendi." });
      }
      onSuccess();
    } catch (error: any) {
      console.error("Yetkinlik işlemi başarısız:", error);
      toast.error("Hata!", {
        description: error.response?.data?.message || `Yetkinlik ${isEditing ? 'güncellenirken' : 'eklenirken'} bir hata oluştu.`,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Yetkinlik Adı</FormLabel>
            <FormControl><Input placeholder="Kıdemli Hemşire" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Açıklama (Opsiyonel)</FormLabel>
            <FormControl><Textarea placeholder="Yetkinlik hakkında kısa bilgi..." className="resize-none" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? (isEditing ? 'Güncelleniyor...' : 'Ekleniyor...') : (isEditing ? 'Yetkinliği Güncelle' : 'Yetkinliği Ekle')}
        </Button>
      </form>
    </Form>
  );
}