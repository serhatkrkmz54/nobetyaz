'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShiftRequirementCreateRequest, createRequirement } from "@/services/shiftRequirementService";
import { Location } from "@/services/locationService";
import { ShiftTemplate } from "@/services/shiftTemplateService";
import { Qualification } from "@/services/qualificationService";
import { toast } from "sonner";
import { APPLY_ON_OPTIONS } from "@/lib/constants";

const formSchema = z.object({
  locationId: z.string().uuid(),
  shiftTemplateId: z.string().uuid(),
  qualificationId: z.string().nullable().optional(),
  applyOn: z.string({ message: "Uygulanacak gün tipi zorunludur." }),
requiredMemberCount: z.string({ message: "Personel sayısı zorunludur."})
    .min(1, "Personel sayısı zorunludur.")
    .refine((val) => {
        const num = Number(val);
        return !isNaN(num) && Number.isInteger(num) && num > 0;
    }, {
        message: "Lütfen 0'dan büyük geçerli bir tam sayı girin."
    })
});

type FormData = z.infer<typeof formSchema>;

interface ShiftRequirementFormProps {
  locations: Location[];
  shiftTemplates: ShiftTemplate[];
  qualifications: Qualification[];
  onSuccess: () => void;
}

export function ShiftRequirementForm({ locations, shiftTemplates, qualifications, onSuccess }: ShiftRequirementFormProps) {
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    locationId: undefined,
    shiftTemplateId: undefined,
    qualificationId: null,
    applyOn: undefined,
    requiredMemberCount: "1",
  },
});

async function onSubmit(values: FormData) {
  try {
const apiData: ShiftRequirementCreateRequest = {
        locationId: values.locationId,
        shiftTemplateId: values.shiftTemplateId,
        qualificationId: values.qualificationId || null,
        applyOn: values.applyOn,
        requiredMemberCount: parseInt(values.requiredMemberCount, 10),
      };
    await createRequirement(apiData);
    toast.success("Başarılı", { description: "Nöbet gereksinimi başarıyla eklendi." });
    onSuccess();
  } catch (error: any) {
    console.error("Gereksinim eklenemedi:", error);
    toast.error("Hata!", {
      description: error.response?.data?.message || "Gereksinim eklenirken bir hata oluştu.",
    });
  }
}

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
       <FormField control={form.control} name="locationId" render={({ field }) => (
          <FormItem>
            <FormLabel>Lokasyon</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Bir lokasyon seçin..." /></SelectTrigger></FormControl>
              <SelectContent>
                {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="shiftTemplateId" render={({ field }) => (
          <FormItem>
            <FormLabel>Nöbet Şablonu</FormLabel>
             <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Bir nöbet şablonu seçin..." /></SelectTrigger></FormControl>
              <SelectContent>
                {shiftTemplates.map(tmpl => <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name} ({tmpl.startTime}-{tmpl.endTime})</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
         <FormField control={form.control} name="qualificationId" render={({ field }) => (
          <FormItem>
            <FormLabel>Gerekli Yetkinlik (Opsiyonel)</FormLabel>
             <Select onValueChange={(value) => field.onChange(value === "ANY" ? null : value)} defaultValue={field.value ?? undefined}>
              <FormControl><SelectTrigger><SelectValue placeholder="Herhangi bir personel veya özel bir yetkinlik..." /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="ANY">Herhangi Bir Personel</SelectItem>
                {qualifications.map(qual => <SelectItem key={qual.id} value={qual.id}>{qual.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField
          control={form.control}
          name="applyOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Uygulanacak Günler *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Bu kural ne zaman geçerli olacak?" /></SelectTrigger></FormControl>
                <SelectContent>
                  {APPLY_ON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Eğer bir gün hem 'Hafta İçi' hem de 'Resmi Tatil' ise, 'Resmi Tatil' kuralı öncelikli olur.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="requiredMemberCount" render={({ field }) => (
            <FormItem>
              <FormLabel>Gereken Personel Sayısı</FormLabel>
              <FormControl><Input type="number" min="1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )} />
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
        {form.formState.isSubmitting ? 'Ekleniyor...' : 'Gereksinimi Ekle'}
      </Button>
    </form>
  </Form>
);
}