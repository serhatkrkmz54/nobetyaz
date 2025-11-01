'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

export default function DateTimeDisplay() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-2 md:mb-0">
          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
          <span className="text-lg font-medium">
            {format(currentDateTime, 'EEEE, d MMMM yyyy', { locale: tr })}
          </span>
        </div>
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-500 mr-2" />
          <span className="text-lg font-medium">
            {format(currentDateTime, 'HH:mm:ss')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}