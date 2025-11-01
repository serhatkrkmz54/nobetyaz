'use client';

import { useState, FormEvent } from 'react';
import { changePasswordAPI, ChangePasswordRequest } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 6) {
        setError("Yeni şifre en az 6 karakter olmalıdır.");
        return;
    }

    setIsSubmitting(true);
    try {
      const requestData: ChangePasswordRequest = { currentPassword, newPassword };
      await changePasswordAPI(requestData);
      toast.success("Başarılı!", { description: "Şifreniz başarıyla güncellendi." });
      // Formu sıfırla
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || "Şifre değiştirilemedi. Mevcut şifreniz yanlış olabilir.";
      setError(msg);
      toast.error("Hata!", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">Mevcut Şifre *</Label>
          <Input
            id="currentPassword" type="password" required
            value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="newPassword">Yeni Şifre *</Label>
          <Input 
            id="newPassword" type="password" required 
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar) *</Label>
          <Input 
            id="confirmPassword" type="password" required 
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Şifreyi Değiştir'}
        </Button>
      </form>
  );
}