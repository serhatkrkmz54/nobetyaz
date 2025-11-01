'use client';

import { useEffect, useState } from 'react';
import { AuditLog, getAllAuditLogs } from '@/services/auditLogService';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAuditLogs();
      setLogs(data);
    } catch (error) {
      toast.error("Hata!", { description: "Denetim kayıtları yüklenirken bir sorun oluştu." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'dd MMMM yyyy, HH:mm:ss', { locale: tr });
  };

  const getActionBadge = (actionType: string) => {
     if (actionType.includes('DELETE') || actionType.includes('REJECT')) {
        return <Badge variant="destructive">{actionType}</Badge>;
     }
     if (actionType.includes('UPDATE') || actionType.includes('APPROVE')) {
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-500 text-white">{actionType}</Badge>;
     }
     if (actionType.includes('CREATE')) {
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">{actionType}</Badge>;
     }
     return <Badge variant="secondary">{actionType}</Badge>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Denetim Kayıtları (Audit Log)</h1>

      <div className="bg-white p-4 rounded-lg shadow">
        {isLoading ? (
          <p className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Zaman Damgası</TableHead>
                <TableHead className="w-[120px]">Kullanıcı</TableHead>
                <TableHead className="w-[180px]">Eylem Tipi</TableHead>
                <TableHead>Açıklama</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground p-8">
                          Gösterilecek denetim kaydı bulunamadı.
                      </TableCell>
                  </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell className="font-medium">{log.username}</TableCell>
                    <TableCell>{getActionBadge(log.actionType)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.description}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}