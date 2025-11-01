'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// Form doğrulama şeması
const formSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı zorunludur."),
  password: z.string().min(1, "Şifre zorunludur."),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  // login fonksiyonunu ve isLoading durumunu store'dan al
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  
  // Form state'i (isSubmitting'i react-hook-form'dan alacağız)
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // ✅ DÜZELTİLMİŞ ONSUBMIT FONKSİYONU
  async function onSubmit(values: FormData) {
    setError(null); // Önceki hatayı temizle
    
    try {
      // 1. Giriş yapmayı dene
      await login(values.username, values.password);
      
      // 2. Hata fırlatılmazsa (başarılı olursa):
      toast.success("Giriş başarılı!", { description: "Ana sayfaya yönlendiriliyorsunuz..." });
      router.push('/dashboard'); // Ana sayfaya yönlendir

    } catch (err: any) {
      // 3. authStore'dan fırlatılan hatayı burada yakala
      console.error("Giriş denemesi başarısız:", err);
      
      // Backend'den gelen spesifik hata mesajını al, yoksa genel bir mesaj ver
      const msg = err.response?.data?.message || "Kullanıcı adı veya şifre hatalı.";
      
      setError(msg); // Form içine hata mesajı bas (opsiyonel)
      toast.error("Giriş Başarısız", { description: msg }); // Kullanıcıya bildir
    }
  }

  // isSubmitting, store'daki isLoading'e değil, formun kendi durumuna bağlı olmalı
  const { isSubmitting } = form.formState;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Giriş Yap</CardTitle>
          <CardDescription>
            Devam etmek için kullanıcı bilgilerinizi girin.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="kullanici.adi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Formun genel hatası */}
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Giriş Yap"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Yeni bir personel misiniz?{" "}
                <Link
                  href="/activate" // <-- '/activate/page.tsx'ye yönlendir
                  className="underline hover:text-primary font-medium"
                >
                  Hesabınızı aktifleştirin
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}