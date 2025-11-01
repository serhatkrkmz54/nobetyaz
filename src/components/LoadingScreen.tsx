'use client';

import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Sayfa yüklendiğinde loading'i kapat
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Rota değişikliklerinde loading'i göster
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50">
      <div className="relative flex flex-col items-center">
        <Clock className="h-16 w-16 text-primary animate-pulse" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-gray-800">Nöbet Yaz</h2>
      <p className="mt-2 text-gray-600">Yükleniyor...</p>
      <div className="mt-8 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-loadingBar" />
      </div>
    </div>
  );
}