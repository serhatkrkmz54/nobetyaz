'use client';

import { useEffect, useState } from 'react';
import { getAllRules, updateRule, RuleConfiguration } from '@/services/ruleService';
import { toast } from 'sonner';
import { RULE_NAME_LABELS } from '@/lib/constants';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

export default function RuleManagementPage() {
  const [rules, setRules] = useState<RuleConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [ruleValues, setRuleValues] = useState<Record<string, string>>({});

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const data = await getAllRules();
      setRules(data);
      const initialValues = Object.fromEntries(data.map(r => [r.ruleKey, r.ruleValue]));
      setRuleValues(initialValues);
    } catch {
      toast.error('Sistem kuralları yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setRuleValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setIsSaving(key);
    try {
      await updateRule(key, { ruleValue: ruleValues[key] });
      toast.success(`${RULE_NAME_LABELS[key] || key} başarıyla güncellendi.`);
      fetchRules();
    } catch {
      toast.error('Kural güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(null);
    }
  };

  const renderInput = (rule: RuleConfiguration) => {
    const value = ruleValues[rule.ruleKey] || '';

    const booleanRules = [
      'ALLOW_MEMBER_PREFERENCES',
      'ENFORCE_FAIR_HOLIDAY_DISTRIBUTION',
      'ALLOW_SHIFT_BIDDING'
    ];
    if (booleanRules.includes(rule.ruleKey)) {
      return (
        <Select value={value} onValueChange={(v) => handleValueChange(rule.ruleKey, v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seçin..." />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="true">Evet (Açık)</SelectItem>
            <SelectItem value="false">Hayır (Kapalı)</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (rule.ruleKey.includes('HOURS') || rule.ruleKey.includes('THRESHOLD')) {
      return (
        <Input
          type="number"
          value={value}
          onChange={e => handleValueChange(rule.ruleKey, e.target.value)}
          className="w-[120px]"
          min={0}
        />
      );
    }

    return (
      <Input
        type="text"
        value={value}
        onChange={e => handleValueChange(rule.ruleKey, e.target.value)}
        className="max-w-[240px]"
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">⚙️ Sistem Ayarları</h1>
        <p className="text-muted-foreground mt-1">
          Sistem davranışını belirleyen temel kuralları burada düzenleyebilirsiniz.
        </p>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="grid gap-6"
        >
          {rules.map(rule => (
            <motion.div
              key={rule.ruleKey}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Card className="hover:shadow-md transition-all border-muted/40">
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    {RULE_NAME_LABELS[rule.ruleKey] || rule.ruleKey}
                  </CardTitle>
                  <CardDescription>{rule.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {renderInput(rule)}
                  <Button
                    size="sm"
                    onClick={() => handleSave(rule.ruleKey)}
                    disabled={isSaving === rule.ruleKey}
                    className="gap-2"
                  >
                    {isSaving === rule.ruleKey ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Kaydet
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
