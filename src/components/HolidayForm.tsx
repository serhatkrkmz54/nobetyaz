'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarIcon } from 'lucide-react';
import { toast } from "sonner";
import { Holiday, HolidayCreateRequest, HolidayUpdateRequest, DayType, createHoliday, updateHoliday } from "@/services/holidayService";
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { HOLIDAY_TYPE_OPTIONS } from "@/lib/constants";


const formSchema = z.object({
  name: z.string().min(2, "Tatil adı en az 2 karakter olmalıdır.").max(100),
  holidayDate: z.date({ message: "Bir tarih seçmek zorunludur." }),
  holidayType: z.string({ message: "Bir tatil tipi seçmek zorunludur." }),
});

type FormData = z.infer<typeof formSchema>;

interface HolidayFormProps {
  initialData?: Holiday | null;
  onSuccess: () => void;
}

export function HolidayForm({ initialData, onSuccess }: HolidayFormProps) {
  const isEditing = !!initialData;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        name: initialData.name,
        holidayDate: parseISO(initialData.holidayDate), 
        holidayType: initialData.holidayType,
    } : {
        name: "",
        holidayDate: undefined,
        holidayType: undefined,
    },
  });

  async function onSubmit(values: FormData) {
    try {
      const formattedDate = format(values.holidayDate, 'yyyy-MM-dd');

      if (isEditing) {
        const apiData: HolidayUpdateRequest = {
            name: values.name,
            holidayDate: formattedDate,
            holidayType: values.holidayType as DayType,
        };
        await updateHoliday(initialData!.id, apiData);
        toast.success("Başarılı", { description: "Tatil kaydı başarıyla güncellendi." });
      } else {
        const apiData: HolidayCreateRequest = {
            name: values.name,
            holidayDate: formattedDate,
            holidayType: values.holidayType as DayType,
        };
        await createHoliday(apiData);
        toast.success("Başarılı", { description: "Tatil kaydı başarıyla eklendi." });
      }
      onSuccess();
    } catch (error: any) {
      console.error("Tatil işlemi başarısız:", error);
      toast.error("Hata!", {
        description: error.response?.data?.message || `Tatil kaydı ${isEditing ? 'güncellenirken' : 'eklenirken'} bir hata oluştu.`,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Tatil / Özel Gün Adı *</FormLabel>
            <FormControl><Input placeholder="Cumhuriyet Bayramı" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="holidayDate" render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>Tarih *</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                                {field.value ? (
                                    format(field.value, 'dd MMMM yyyy', { locale: tr })
                                ) : (
                                    <span>Bir tarih seçin</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={tr}/>
                    </PopoverContent>
                </Popover>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="holidayType" render={({ field }) => (
            <FormItem>
              <FormLabel>Gün Tipi *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Bir gün tipi seçin..." /></SelectTrigger></FormControl>
                <SelectContent>
                  {HOLIDAY_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
        )} />

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? (isEditing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (isEditing ? 'Kaydı Güncelle' : 'Kaydı Ekle')}
        </Button>
      </form>
    </Form>
  );
}