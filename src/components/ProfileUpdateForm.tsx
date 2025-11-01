'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { User, useAuthStore } from "@/store/authStore";
import { updateUserProfileAPI, UserUpdateRequest } from "@/services/userService";

const formSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır."),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır."),
  email: z.string().email("Geçerli bir email adresi girin."),
  phoneNumber: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface ProfileUpdateFormProps {
  currentUser: User;
}

export function ProfileUpdateForm({ currentUser }: ProfileUpdateFormProps) {
  const { checkAuth } = useAuthStore();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      email: currentUser.email || "",
      phoneNumber: currentUser.phoneNumber || null, 
    },
  });

  async function onSubmit(values: FormData) {
    try {
      const apiData: UserUpdateRequest = { ...values, phoneNumber: values.phoneNumber || null };
      await updateUserProfileAPI(apiData);

      await checkAuth();
      
      toast.success("Başarılı", { description: "Profil bilgileriniz güncellendi." });
    } catch (error: any) {
      toast.error("Hata!", {
        description: error.response?.data?.message || "Profil güncellenirken bir hata oluştu.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad</FormLabel>
                <FormControl><Input placeholder="Adınız" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Soyad</FormLabel>
                <FormControl><Input placeholder="Soyadınız" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="email@adresiniz.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon (Opsiyonel)</FormLabel>
              <FormControl><Input type="tel" placeholder="555..." {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Değişiklikleri Kaydet"}
        </Button>
      </form>
    </Form>
  );
}