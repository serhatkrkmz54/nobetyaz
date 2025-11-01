'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { performSetup, SetupRequest } from '@/services/setupService';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SetupPage() {
  const router = useRouter();
  const { isSetupComplete, checkSetupStatus } = useAppStore();
  const [formData, setFormData] = useState<SetupRequest>({
    industryProfile: 'HEALTHCARE',
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
    adminPhoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSetupStatus().then(isComplete => {
      if (isComplete) {
        router.replace('/login');
      }
    });
  }, [checkSetupStatus, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, industryProfile: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await performSetup(formData);
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kurulum sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSetupComplete === null || isSetupComplete === true) {
    return <div>Yönlendiriliyorsunuz...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sistem Kurulumu</CardTitle>
          <CardDescription>
            Başlamak için lütfen sistem ayarlarını ve ilk yönetici hesabını oluşturun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Sektör Profili</Label>
              <Select onValueChange={handleSelectChange} defaultValue={formData.industryProfile}>
                  <SelectTrigger>
                      <SelectValue placeholder="Bir sektör seçin" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="HEALTHCARE">Sağlık (Hastane)</SelectItem>
                      <SelectItem value="SECURITY">Güvenlik</SelectItem>
                      <SelectItem value="OTHER">Diğer</SelectItem>
                  </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="adminFirstName">Yönetici Adı</Label>
                    <Input id="adminFirstName" onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="adminLastName">Yönetici Soyadı</Label>
                    <Input id="adminLastName" onChange={handleChange} required />
                </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="adminUsername">Yönetici Kullanıcı Adı</Label>
              <Input id="adminUsername" onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adminEmail">Yönetici Email</Label>
              <Input id="adminEmail" type="email" onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
                  <Label htmlFor="adminPhoneNumber">Yönetici Telefon Numarası</Label>
                  <Input 
                    id="adminPhoneNumber" 
                    type="tel" // Telefon numaraları için 'tel' tipi kullanmak en iyisidir
                    placeholder="5551234567"
                    onChange={handleChange} 
                    required 
                  />
                </div>
            <div className="grid gap-2">
              <Label htmlFor="adminPassword">Yönetici Şifresi</Label>
              <Input id="adminPassword" type="password" onChange={handleChange} required />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Kurulum yapılıyor...' : 'Kurulumu Tamamla'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}