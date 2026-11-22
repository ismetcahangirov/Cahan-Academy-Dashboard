// DEV-ONLY component gallery (route /_kit, registered only when import.meta.env.DEV).
// Page agents: open http://localhost:5173/_kit to see every kit piece in both themes.
// Sample copy is hard-coded on purpose — this page never ships to production.
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Users, BookOpen, CalendarDays, Trash2, Search, Pencil, Download } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  StatusPill,
  StatusDot,
  Badge,
  Table,
  Modal,
  FormField,
  Input,
  Textarea,
  NativeSelect,
  Checkbox,
  EmptyState,
  StatCard,
  PageShell,
  Section,
  Skeleton,
} from '../../components/ui';
import {
  OrnamentDivider,
  OrnateFrame,
  Timeline,
  TimelineItem,
  WaxSeal,
  LaceEdge,
  LaceCorner,
  DrapedRibbon,
  WaveEdge,
  Edelweiss,
  EdelweissGlyph,
  SketchIllustration,
} from '../../components/ornament';
import { BrandLockup, BrandLogo, BrandMark } from '../../components/brand';
import Select from '../../components/common/Select';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';

const ROWS = [
  { id: 1, name: 'Aysel Məmmədova', group: 'Frontend A', score: 94, status: 'present', label: 'İştirak edib' },
  { id: 2, name: 'Tural Həsənov', group: 'Frontend A', score: 78, status: 'late', label: 'Gecikib' },
  { id: 3, name: 'Günel Əliyeva', group: 'Backend B', score: 0, status: 'absent', label: 'İştirak etməyib' },
  { id: 4, name: 'Orxan Quliyev', group: 'Backend B', score: 85, status: 'excused', label: 'Üzrlü' },
];

const KitPreview = () => {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState('a');

  return (
    <PageShell
      title="Bəzək dəsti"
      subtitle="Komponentlər · Ornamentlər · Statuslar"
      actions={
        <>
          <Button variant="outline" icon={Download}>İxrac et</Button>
          <Button icon={Plus}>Yeni qrup</Button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tələbələr" value="128" icon={Users} trend="up" trendLabel="+12" hint="bu ay" />
        <StatCard label="Aktiv kurslar" value="9" icon={BookOpen} hint="3 qrupda" />
        <StatCard label="Bu gün dərslər" value="4" icon={CalendarDays} trend="flat" hint="dünənki kimi" />
        <StatCard label="Ödənişlər" value="86%" icon={Download} trend="down" trendLabel="−4%" hint="keçən aya görə" />
      </div>

      <Section title="Düymələr və statuslar" subtitle="Rəng yox, forma və ikon">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Yadda saxla</Button>
          <Button variant="outline">Ətraflı bax</Button>
          <Button variant="ghost">Ləğv et</Button>
          <Button variant="danger" icon={Trash2}>Sil</Button>
          <Button size="sm" variant="outline" icon={Pencil}>Redaktə</Button>
          <Button loading>Göndərilir</Button>
          <Button iconOnly variant="ghost" icon={Search} aria-label="Axtar" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <StatusPill status="success">Tamamlanıb</StatusPill>
          <StatusPill status="present">İştirak edib</StatusPill>
          <StatusPill status="late">Gecikib</StatusPill>
          <StatusPill status="partial">Qismən</StatusPill>
          <StatusPill status="absent">İştirak etməyib</StatusPill>
          <StatusPill status="pending">Gözləyir</StatusPill>
          <StatusPill status="excused">Üzrlü</StatusPill>
          <StatusPill status="warning">Müddət bitir</StatusPill>
          <StatusPill status="error">Gecikmiş ödəniş</StatusPill>
          <StatusPill status="info">Məlumat</StatusPill>
          <StatusPill status="neutral">Qaralama</StatusPill>
          <Badge>12 tələbə</Badge>
          <Badge tone="accent">Yeni</Badge>
          <StatusDot status="present" label="İştirak" />
          <StatusDot status="late" label="Gecikmə" />
          <StatusDot status="absent" label="Yoxdur" />
          <StatusDot status="excused" label="Üzrlü" />
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardHeader title="Plain kart" subtitle="Sıx siyahılar, cədvəllər" actions={<Button size="sm" variant="ghost">Hamısı</Button>} />
          <p className="mt-3 text-ink-muted">Nazik çərçivə, ağ (qaranlıqda şərab) səth. Hər sırada bəzək olmur.</p>
        </Card>
        <Card variant="ornate" className="p-6">
          <CardHeader title="Ornate kart" subtitle="Xülasə, vurğu" />
          <p className="mt-3 text-ink-muted">Daxili tük xətti, yumşaq daxili parıltı, iki künc bəzəyi.</p>
        </Card>
        <Card variant="paper" className="p-6">
          <CardHeader title="Paper kart" subtitle="Oxu, forma" />
          <p className="mt-3 text-ink-muted">Perqament fonu və faktura — əlyazma hissi.</p>
        </Card>
        <Card variant="featured" hover className="p-6">
          <CardHeader title="Featured kart" subtitle="Seçilmiş element" />
          <p className="mt-3 text-ink-muted">Yuxarı kənardan asılan atlaz əlfəcin lenti.</p>
        </Card>
      </div>

      <Section title="Cədvəl" subtitle="Kiçik başlıqlar, tük xətləri">
        <Table caption="Davamiyyət">
          <thead>
            <tr>
              <th>Tələbə</th>
              <th>Qrup</th>
              <th>Status</th>
              <th className="num">Bal</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="flex items-center gap-3">
                    <Avatar name={r.name} className="h-8 w-8" textSize="xs" />
                    {r.name}
                  </span>
                </td>
                <td className="text-ink-muted">{r.group}</td>
                <td><StatusPill status={r.status}>{r.label}</StatusPill></td>
                <td className="num">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Forma" variant="paper">
          <div className="space-y-4">
            <FormField label="Qrupun adı" hint="Tələbələr bu adı görəcək">
              {(id, d) => <Input id={id} aria-describedby={d} placeholder="Məs. Frontend A" />}
            </FormField>
            <FormField label="E-poçt" error="E-poçt düzgün deyil">
              {(id, d, inv) => <Input id={id} aria-describedby={d} invalid={inv} icon={Search} defaultValue="aysel@" />}
            </FormField>
            <FormField label="Kurs">
              {(id) => (
                <NativeSelect id={id} defaultValue="1">
                  <option value="1">Frontend</option>
                  <option value="2">Backend</option>
                </NativeSelect>
              )}
            </FormField>
            <FormField label="Müəllim (Select)">
              <Select
                value={sel}
                onChange={setSel}
                options={[
                  { label: 'Aysel Məmmədova', value: 'a' },
                  { label: 'Tural Həsənov', value: 'b' },
                ]}
              />
            </FormField>
            <FormField label="Qeyd">{(id) => <Textarea id={id} rows={3} placeholder="Qısa təsvir…" />}</FormField>
            <Checkbox label="Tələbələrə bildiriş göndər" defaultChecked />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost">Ləğv et</Button>
              <Button onClick={() => setOpen(true)}>Modalı aç</Button>
            </div>
          </div>
        </Section>

        <Section title="Bu gün" subtitle="Timeline">
          <OrnateFrame className="p-6">
            <Timeline>
              <TimelineItem time="09:00" title="Riyaziyyat" meta="Frontend A · Otaq 3" state="done" />
              <TimelineItem time="11:30" title="JavaScript" meta="Frontend A · Onlayn" state="current">
                <Button size="sm" variant="outline">Dərsə qoşul</Button>
              </TimelineItem>
              <TimelineItem time="14:00" title="Node.js" meta="Backend B" />
              <TimelineItem time="16:00" title="Layihə müzakirəsi" meta="Ləğv edilib" state="cancelled" />
            </Timeline>
          </OrnateFrame>
        </Section>
      </div>

      <Section title="Boş vəziyyət">
        <Card>
          <EmptyState
            sketch="inkwell"
            title="Hələ tapşırıq yoxdur"
            description="İlk ev tapşırığını yaradın — tələbələr onu dərhal görəcək."
            action={<Button variant="outline" icon={Plus}>Tapşırıq yarat</Button>}
          />
        </Card>
      </Section>

      <Section title="Ornamentlər">
        <div className="space-y-8">
          <OrnamentDivider />
          <OrnamentDivider align="start" />
          <div className="flex flex-wrap items-end gap-8 text-accent-text">
            <BrandMark className="h-14 w-auto" />
            <BrandLockup className="h-12 w-auto" />
            <BrandLogo className="h-32 w-auto" />
            <Edelweiss className="h-16 w-16" />
            <EdelweissGlyph className="h-6 w-6" />
            <WaxSeal size={84} />
            <Spinner />
          </div>
          <div className="flex flex-wrap items-end gap-6">
            {['books', 'inkwell', 'globe', 'lamp', 'cap', 'notebook'].map((n) => (
              <SketchIllustration key={n} name={n} className="w-28" />
            ))}
          </div>
          <div className="theme-wine login-hero relative h-64 overflow-hidden rounded-[var(--radius-lg)]">
            <LaceCorner corner="tl" className="absolute left-0 top-0 w-36" />
            <DrapedRibbon className="absolute -right-6 -top-2 w-60" />
            <p className="absolute inset-x-0 top-20 text-center font-script text-[2.6rem] text-white">Wine panel</p>
            <LaceEdge direction="up" size={22} className="absolute inset-x-0 bottom-9" />
            <WaveEdge fill="var(--page-base)" className="absolute inset-x-0 -bottom-px" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Skeleton className="h-5" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-16 rounded-[var(--radius-md)]" />
            <Skeleton className="h-16 rounded-[var(--radius-md)]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast.success('Qrup yadda saxlanıldı')}>Toast: uğur</Button>
            <Button variant="outline" onClick={() => toast.error('Qrup yadda saxlanmadı: ad boşdur')}>Toast: xəta</Button>
            <Button variant="outline" onClick={() => toast('Sabah 09:00-da dərs var')}>Toast: məlumat</Button>
          </div>
        </div>
      </Section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Yeni qrup"
        subtitle="Əsas məlumatlar"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Ləğv et</Button>
            <Button onClick={() => setOpen(false)}>Yarat</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Qrupun adı">{(id) => <Input id={id} placeholder="Məs. Frontend A" />}</FormField>
          <FormField label="Təsvir">{(id) => <Textarea id={id} rows={3} />}</FormField>
        </div>
      </Modal>
    </PageShell>
  );
};

export default KitPreview;
