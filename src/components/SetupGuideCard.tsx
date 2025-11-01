'use client';

import { useState } from 'react';
import { useOnboardingStore, OnboardingTask } from '@/store/onboardingStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronDown, ChevronUp, Rocket, X } from "lucide-react";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

export function SetupGuideCard() {
  const tasks = useOnboardingStore((state) => state.tasks);
  const allTasksComplete = useOnboardingStore((state) => state.allTasksComplete);
  const isCollapsed = useOnboardingStore((state) => state.isCollapsed);
  const toggleTask = useOnboardingStore((state) => state.toggleTask);
  const hideGuide = useOnboardingStore((state) => state.hideGuide);
  const toggleCollapsed = useOnboardingStore((state) => state.toggleCollapsed);

  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);

  if (allTasksComplete) {
    return null;
  }

  return (
    <>

<Card className="mb-8 shadow-lg border-primary/20 bg-gradient-to-r from-slate-50 to-white">
        
        {/* --- DÜZELTME: <Collapsible> kartın içine alındı --- */}
        <Collapsible
          open={!isCollapsed}
          onOpenChange={toggleCollapsed}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            {/* Başlık alanı da artık bir tetikleyici (aç/kapat) */}
            <CollapsibleTrigger asChild>
              <div className="space-y-1 cursor-pointer">
                <CardTitle className="flex items-center text-xl">
                  <Rocket className="h-5 w-5 mr-3 text-primary" />
                  Hızlı Başlangıç Rehberi
                </CardTitle>
                <CardDescription className="mb-5">
                  NöbetYaz sistemini kurmak için bu 5 adımı takip edin:
                </CardDescription>
              </div>
            </CollapsibleTrigger>
            
            <div className="flex items-center">
              {/* Açma/Kapama Butonu (Bu da bir tetikleyici) */}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isCollapsed ? "Göster" : "Gizle"}
                  {isCollapsed ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronUp className="h-4 w-4 ml-2" />}
                </Button>
              </CollapsibleTrigger>
              
              {/* Kalıcı Kapatma Butonu (Bu bir tetikleyici DEĞİL) */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={hideGuide} // Sadece 'hideGuide' fonksiyonunu çağırır
                title="Rehberi kalıcı olarak gizle"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* CollapsibleContent, CardHeader'ın kardeşi (sibling) olmalı */}
          <CollapsibleContent>
            <CardContent className="space-y-2 pt-0">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    task.isComplete ? "bg-green-50 border-green-200" : "bg-white"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={task.id}
                      checked={task.isComplete}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div>
                      <label
                        htmlFor={task.id}
                        className={cn(
                          "font-medium",
                          task.isComplete && "line-through text-muted-foreground"
                        )}
                      >
                        <Button
                          variant="link"
                          className="p-0 h-auto text-base font-medium"
                          onClick={() => setSelectedTask(task)} // Modal'ı açar
                        >
                          {task.title}
                        </Button>
                      </label>
                    </div>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={task.link}>
                      Git <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedTask.details.title}</DialogTitle>
                <DialogDescription asChild>
                  <div className="pt-4 text-sm text-foreground">
                    {selectedTask.details.description}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="mt-4">
                  Kapat
                </Button>
              </DialogClose>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}