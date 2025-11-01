'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { activateAccountAPI, ActivateAccountRequest } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Yeni form şeması
const formSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı zorunludur."),
  pin: z.string().min(6, "PIN 6 haneli olmalıdır.").max(6, "PIN 6 haneli olmalıdır."),
  newPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export default function ActivatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", pin: "", newPassword: "", confirmPassword: "" },
  });
  
  const { isSubmitting } = form.formState;

  const handleSubmit = async (values: FormData) => {
    setError(null);
    try {
      const apiData: ActivateAccountRequest = {
        username: values.username,
        pin: values.pin,
        newPassword: values.newPassword,
      };
      
      const message = await activateAccountAPI(apiData);
      
      toast.success("Başarılı!", { description: message });
      router.push('/login');

    } catch (err: any) {
      const msg = err.response?.data?.message || "Hesap aktifleştirilemedi. Bilgilerinizi kontrol edin.";
      setError(msg);
      toast.error("Hata!", { description: msg });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Hesabınızı Aktifleştirin</CardTitle>
          <CardDescription>
            Yöneticinizden aldığınız kullanıcı adı, PIN kodu ve yeni şifrenizle hesabınızı oluşturun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem><FormLabel>Kullanıcı Adı *</FormLabel><FormControl><Input placeholder="kullanici.adi" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="pin" render={({ field }) => (
                <FormItem><FormLabel>6 Haneli PIN Kodu *</FormLabel><FormControl><Input placeholder="123456" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="newPassword" render={({ field }) => (
                <FormItem><FormLabel>Yeni Şifre *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Yeni Şifre (Tekrar) *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Hesabı Aktifleştir ve Giriş Yap'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}