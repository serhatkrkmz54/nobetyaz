'use client';

import { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAllShiftTemplates, ShiftTemplate } from '@/services/shiftTemplateService';
import { getMyPreferencesAPI, createPreferenceAPI, deletePreferenceAPI, MemberPreferenceResponse, MemberPreferenceCreateRequest } from '@/services/preferenceService';
import { DAY_OF_WEEK_OPTIONS, PREFERENCE_SCORE_OPTIONS } from '@/lib/constants';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { toast } from 'sonner';

const formSchema = z.object({
    shiftTemplateId: z.string({ message: "Nöbet şablonu zorunludur." }),
    dayOfWeek: z.string({ message: "Haftanın günü zorunludur." }),
    preferenceScore: z.string({ message: "Tercih puanı zorunludur." }),
});

type FormData = z.infer<typeof formSchema>;

export function MemberPreferenceForm() {
    const [preferences, setPreferences] = useState<MemberPreferenceResponse[]>([]);
    const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            shiftTemplateId: undefined,
            dayOfWeek: undefined,
            preferenceScore: "0",
        },
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [prefs, templates] = await Promise.all([
                getMyPreferencesAPI(),
                getAllShiftTemplates()
            ]);
            setPreferences(prefs);
            setShiftTemplates(templates.filter(t => t.isActive));
        } catch (error) {
            toast.error("Hata", { description: "Tercihleriniz veya nöbet şablonları yüklenemedi." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    async function onSubmit(values: FormData) {
        const apiData: MemberPreferenceCreateRequest = {
            shiftTemplateId: values.shiftTemplateId,
            dayOfWeek: parseInt(values.dayOfWeek, 10),
            preferenceScore: parseInt(values.preferenceScore, 10),
        };
        try {
            await createPreferenceAPI(apiData);
            toast.success("Tercih Eklendi");
            form.reset();
            fetchData();
        } catch (error: any) {
            toast.error("Hata!", { description: error.response?.data?.message || "Tercih eklenirken bir hata oluştu (Belki bu tercih zaten vardır?)." });
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deletePreferenceAPI(id);
            toast.success("Tercih Silindi");
            fetchData();
        } catch {
            toast.error("Hata!", { description: "Tercih silinirken bir hata oluştu." });
        }
    };

    const getDayLabel = (day: number) => DAY_OF_WEEK_OPTIONS.find(d => d.value === day)?.label || day;
    const getScoreLabel = (score: number) => PREFERENCE_SCORE_OPTIONS.find(s => s.value === score)?.label || score;

    if (isLoading) {
        return (
            <div className="text-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 border rounded-lg space-y-4">
                    <h4 className="text-md font-medium">Yeni Tercih Ekle</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                        <FormField control={form.control} name="shiftTemplateId" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Nöbet Şablonu</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full truncate">
                                            <SelectValue placeholder="Şablon seçin..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent position="popper" className="z-[9999] max-h-[250px]">
                                        {shiftTemplates.map(t => (
                                            <SelectItem key={t.id} value={t.id} className="truncate">
                                                {t.name} ({t.startTime.substring(0, 5)}-{t.endTime.substring(0, 5)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="dayOfWeek" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Haftanın Günü</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Gün seçin..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent position="popper" className="z-[9999]">
                                        {DAY_OF_WEEK_OPTIONS.map(d => (
                                            <SelectItem key={d.value} value={d.value.toString()}>
                                                {d.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="preferenceScore" render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Tercih Durumu</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Tercih seçin..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent position="popper" className="z-[9999]">
                                        {PREFERENCE_SCORE_OPTIONS.map(s => (
                                            <SelectItem key={s.value} value={s.value.toString()}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
                            {form.formState.isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <PlusCircle className="mr-2 h-4 w-4" />
                            )}
                            Ekle
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nöbet</TableHead>
                            <TableHead>Gün</TableHead>
                            <TableHead>Tercih</TableHead>
                            <TableHead className="text-right">Sil</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {preferences.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    Henüz bir nöbet tercihi eklemediniz.
                                </TableCell>
                            </TableRow>
                        ) : (
                            preferences.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">
                                        {p.shiftTemplateName}{" "}
                                        <span className="text-xs text-muted-foreground">
                                            ({p.shiftTemplateTime})
                                        </span>
                                    </TableCell>
                                    <TableCell>{getDayLabel(p.dayOfWeek)}</TableCell>
                                    <TableCell>
                                        <span
                                            className={
                                                p.preferenceScore > 0
                                                    ? "text-green-600"
                                                    : p.preferenceScore < 0
                                                        ? "text-red-600"
                                                        : "text-muted-foreground"
                                            }
                                        >
                                            {getScoreLabel(p.preferenceScore)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
