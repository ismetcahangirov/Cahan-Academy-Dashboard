# COMPONENTS.md — Komponent Kataloqu

> **Layihə:** Cahan Academy Dashboard  
> **GitHub:** [ismetcahangirov/Cahan-Academy-Dashboard](https://github.com/ismetcahangirov/Cahan-Academy-Dashboard)  
> **Son yenilənmə:** 2026

---

## 1. Komponent Strukturu

```
src/components/
├── common/          ← Hər yerdə istifadə olunan bazis komponentlər
│   ├── Button.jsx
│   ├── Input.jsx
│   ├── Modal.jsx
│   ├── Table.jsx
│   ├── Badge.jsx
│   ├── Avatar.jsx
│   ├── Spinner.jsx
│   ├── EmptyState.jsx
│   ├── ErrorBoundary.jsx
│   └── ConfirmDialog.jsx
│
├── layout/          ← Səhifə quruluşu komponentləri
│   ├── AppLayout.jsx
│   ├── Sidebar.jsx
│   ├── BottomTabs.jsx
│   ├── Header.jsx
│   └── ProtectedRoute.jsx
│
└── ui/              ← Dashboard və səhifəyə xas UI elementləri
    ├── StatCard.jsx
    ├── PageHeader.jsx
    ├── SearchBar.jsx
    └── LanguageSwitcher.jsx
```

---

## 2. Common Komponentlər

---

### Button

Bütün düymə variantları üçün vahid komponent.

**Fayl:** `src/components/common/Button.jsx`

**Props:**

| Prop | Tip | Default | Açıqlama |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Düymə görünüşü |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Ölçü |
| `isLoading` | `boolean` | `false` | Yüklənmə vəziyyəti |
| `disabled` | `boolean` | `false` | Deaktiv vəziyyət |
| `fullWidth` | `boolean` | `false` | Tam en |
| `icon` | `ReactNode` | — | Sol tərəfdə ikon |
| `onClick` | `function` | — | Klik hadisəsi |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML tipi |

**İstifadə:**

```jsx
import Button from '../components/common/Button';
import { Plus, Trash2 } from 'lucide-react';

// Əsas
<Button variant="primary" onClick={handleCreate}>
  Əlavə et
</Button>

// İkon ilə
<Button variant="primary" icon={<Plus size={16} />}>
  Qrup yarat
</Button>

// Yüklənmə vəziyyəti
<Button isLoading={isLoading} variant="primary" type="submit">
  Yadda saxla
</Button>

// Təhlükəli əməliyyat
<Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDelete}>
  Sil
</Button>

// Ghost (outline)
<Button variant="ghost" onClick={handleCancel}>
  Ləğv et
</Button>
```

**Rəng xəritəsi:**

| Variant | Fon | Mətn | Hover |
|---|---|---|---|
| `primary` | Bordo (`#800020`) | Ağ | Tünd bordo |
| `secondary` | Açıq boz | Tünd | Boz |
| `danger` | Qırmızı | Ağ | Tünd qırmızı |
| `ghost` | Şəffaf | Bordo | Açıq bordo fonu |

---

### Input

Forma sahəsi — label, xəta mesajı, ikon dəstəyi ilə.

**Fayl:** `src/components/common/Input.jsx`

**Props:**

| Prop | Tip | Default | Açıqlama |
|---|---|---|---|
| `label` | `string` | — | Sahə başlığı |
| `error` | `string` | — | Xəta mesajı |
| `hint` | `string` | — | Köməkçi mətn |
| `leftIcon` | `ReactNode` | — | Sol ikon |
| `rightIcon` | `ReactNode` | — | Sağ ikon |
| `required` | `boolean` | `false` | Məcburi sahə işarəsi |
| `...rest` | — | — | Bütün HTML input atributları |

**İstifadə:**

```jsx
import Input from '../components/common/Input';
import { Mail, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';

const { register, formState: { errors } } = useForm();

// Sadə
<Input label="Ad" placeholder="Adınızı daxil edin" {...register('name')} />

// Xəta ilə
<Input
  label="Email"
  leftIcon={<Mail size={16} />}
  error={errors.email?.message}
  {...register('email')}
/>

// İpucu ilə
<Input
  label="Şifrə"
  type="password"
  hint="Minimum 8 simvol"
  rightIcon={<Eye size={16} />}
  error={errors.password?.message}
  {...register('password')}
/>

// Məcburi
<Input label="Başlıq" required {...register('title')} />
```

---

### Modal

Overlay üzərində dialoq pəncərəsi.

**Fayl:** `src/components/common/Modal.jsx`

**Props:**

| Prop | Tip | Default | Açıqlama |
|---|---|---|---|
| `isOpen` | `boolean` | — | Açıq/bağlı vəziyyət |
| `onClose` | `function` | — | Bağlama hadisəsi |
| `title` | `string` | — | Modal başlığı |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Ölçü |
| `children` | `ReactNode` | — | Məzmun |
| `footer` | `ReactNode` | — | Alt hissə (düymələr) |
| `closeOnOverlay` | `boolean` | `true` | Overlay klikdə bağla |

**Ölçülər:**

| Size | Genişlik |
|---|---|
| `sm` | 400px |
| `md` | 560px |
| `lg` | 720px |
| `xl` | 900px |

**İstifadə:**

```jsx
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { useState } from 'react';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Müəllim dəvət et"
  size="sm"
  footer={
    <div className="flex gap-3 justify-end">
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Ləğv et</Button>
      <Button variant="primary" type="submit" form="invite-form">Dəvət göndər</Button>
    </div>
  }
>
  <form id="invite-form">
    <Input label="Email" type="email" placeholder="muellim@example.com" />
  </form>
</Modal>
```

---

### Table

Sütun konfiqurasiyası ilə universal cədvəl.

**Fayl:** `src/components/common/Table.jsx`

**Props:**

| Prop | Tip | Açıqlama |
|---|---|---|
| `columns` | `Column[]` | Sütun konfiqurasiyası |
| `data` | `object[]` | Sıra məlumatları |
| `isLoading` | `boolean` | Yüklənmə vəziyyəti |
| `emptyMessage` | `string` | Boş hal mesajı |
| `onRowClick` | `function` | Sıra klik hadisəsi |

**Column tipi:**

```typescript
type Column = {
  key:       string;
  title:     string;
  width?:    string;
  render?:   (value, row) => ReactNode;  // Xüsusi render
  sortable?: boolean;
}
```

**İstifadə:**

```jsx
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';

const columns = [
  {
    key:   'name',
    title: 'Ad',
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <Avatar src={row.avatar} name={row.name} size="sm" />
        <span>{row.name}</span>
      </div>
    ),
  },
  { key: 'email', title: 'Email' },
  {
    key:   'isActive',
    title: 'Status',
    render: (value) => (
      <Badge variant={value ? 'success' : 'error'}>
        {value ? 'Aktiv' : 'Deaktiv'}
      </Badge>
    ),
  },
  {
    key:   'actions',
    title: '',
    width: '120px',
    render: (_, row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
          Düzəlt
        </Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>
          Sil
        </Button>
      </div>
    ),
  },
];

<Table
  columns={columns}
  data={teachers}
  isLoading={isLoading}
  emptyMessage="Hələ müəllim əlavə edilməyib"
  onRowClick={(row) => navigate(`/teachers/${row._id}`)}
/>
```

---

### Badge

Status, rol, növ göstərməsi üçün etiket.

**Fayl:** `src/components/common/Badge.jsx`

**Props:**

| Prop | Tip | Default | Açıqlama |
|---|---|---|---|
| `variant` | `'success' \| 'error' \| 'warning' \| 'info' \| 'default'` | `'default'` | Rəng variantı |
| `size` | `'sm' \| 'md'` | `'md'` | Ölçü |
| `children` | `ReactNode` | — | Məzmun |

**İstifadə:**

```jsx
import Badge from '../components/common/Badge';

<Badge variant="success">Aktiv</Badge>
<Badge variant="error">Deaktiv</Badge>
<Badge variant="warning">Gözləyir</Badge>
<Badge variant="info">Müəllim</Badge>
<Badge variant="default">Tələbə</Badge>
```

**Rəng xəritəsi:**

| Variant | Fon | Mətn |
|---|---|---|
| `success` | Açıq yaşıl | Tünd yaşıl |
| `error` | Açıq qırmızı | Tünd qırmızı |
| `warning` | Açıq sarı | Tünd narıncı |
| `info` | Açıq mavi | Tünd mavi |
| `default` | Açıq boz | Tünd boz |

---

### Avatar

İstifadəçi şəkli — şəkil yoxdursa baş hərflər.

**Fayl:** `src/components/common/Avatar.jsx`

**Props:**

| Prop | Tip | Default | Açıqlama |
|---|---|---|---|
| `src` | `string` | — | Şəkil URL-i |
| `name` | `string` | — | İstifadəçi adı (baş hərf üçün) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Ölçü |
| `className` | `string` | — | Əlavə CSS sinifləri |

**Ölçülər:**

| Size | Piksel |
|---|---|
| `xs` | 24px |
| `sm` | 32px |
| `md` | 40px |
| `lg` | 56px |
| `xl` | 80px |

**İstifadə:**

```jsx
import Avatar from '../components/common/Avatar';

// Şəkil ilə
<Avatar src="https://example.com/photo.jpg" name="Leyla Məmmədova" size="md" />

// Şəkil yoxdursa → "LM" göstərilir
<Avatar name="Leyla Məmmədova" size="lg" />

// Cədvəl içində
<Avatar src={user.avatar} name={user.name} size="sm" />
```

---

### Spinner

Yüklənmə göstəricisi.

**Fayl:** `src/components/common/Spinner.jsx`

**Props:**

| Prop | Tip | Default | Açıqlama |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Ölçü |
| `color` | `string` | Bordo | CSS rəng |
| `fullPage` | `boolean` | `false` | Tam səhifəni əhat et |

**İstifadə:**

```jsx
import Spinner from '../components/common/Spinner';

// Sadə
<Spinner />

// Tam səhifə
<Spinner fullPage />

// Düymə içində
{isLoading ? <Spinner size="sm" color="white" /> : 'Yadda saxla'}
```

---

### EmptyState

Boş məlumat halları üçün placeholder.

**Fayl:** `src/components/common/EmptyState.jsx`

**Props:**

| Prop | Tip | Default | Açıqlama |
|---|---|---|---|
| `icon` | `ReactNode` | `<InboxIcon />` | Lucide ikonu |
| `title` | `string` | `'Məlumat yoxdur'` | Başlıq |
| `message` | `string` | — | Açıqlama |
| `action` | `ReactNode` | — | Düymə və ya link |

**İstifadə:**

```jsx
import EmptyState from '../components/common/EmptyState';
import { Users } from 'lucide-react';

<EmptyState
  icon={<Users size={40} />}
  title="Hələ müəllim yoxdur"
  message="İlk müəllimi dəvət etmək üçün aşağıdakı düyməni istifadə edin"
  action={
    <Button variant="primary" icon={<Plus size={16} />} onClick={openInviteModal}>
      Müəllim dəvət et
    </Button>
  }
/>
```

---

### ConfirmDialog

Silmə/kritik əməliyyat üçün təsdiq dialoqu.

**Fayl:** `src/components/common/ConfirmDialog.jsx`

**Props:**

| Prop | Tip | Default | Açıqlama |
|---|---|---|---|
| `isOpen` | `boolean` | — | Açıq/bağlı |
| `onClose` | `function` | — | Ləğv etmə |
| `onConfirm` | `function` | — | Təsdiq etmə |
| `title` | `string` | `'Əminsiniz?'` | Başlıq |
| `message` | `string` | — | Açıqlama |
| `confirmText` | `string` | `'Bəli, sil'` | Təsdiq düyməsi mətni |
| `isLoading` | `boolean` | `false` | Yüklənmə |

**İstifadə:**

```jsx
import ConfirmDialog from '../components/common/ConfirmDialog';

const [deleteId, setDeleteId] = useState(null);

<ConfirmDialog
  isOpen={!!deleteId}
  onClose={() => setDeleteId(null)}
  onConfirm={() => handleDelete(deleteId)}
  title="Müəllimi sil"
  message="Bu müəllim silinəcək. Bu əməliyyat geri alına bilməz."
  confirmText="Bəli, sil"
  isLoading={isDeleting}
/>
```

---

## 3. Layout Komponentləri

---

### AppLayout

Bütün qorunan səhifələri əhat edən ana layout.

**Fayl:** `src/components/layout/AppLayout.jsx`

**Davranış:**
- Desktop (≥1024px): Sidebar + Header + Main
- Mobil (<1024px): Header + Main + BottomTabs
- Sidebar vəziyyəti Redux-da saxlanır

```jsx
// Necə istifadə olunur (App.jsx-də):
<Route element={<ProtectedRoute allowedRoles={['admin','teacher','student']} />}>
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    {/* ... */}
  </Route>
</Route>
```

---

### Sidebar

Desktop naviqasiya paneli.

**Fayl:** `src/components/layout/Sidebar.jsx`

**Xüsusiyyətlər:**
- Açıq vəziyyət: 280px, tam etiketlər
- Bağlı vəziyyət: 72px, yalnız ikonlar (tooltip ilə)
- Animasiya: CSS transition ilə rəvan keçid
- Aktiv link: bordo rəng + sol kənar xətti
- İstifadəçi adı/email alt hissədə
- Çıxış düyməsi

**Naviqasiya Məntiqi:**
```jsx
// navItems.js-dən rola görə filteri
const { role } = useRole();
const items    = getNavItems(role);
```

---

### BottomTabs

Mobil üçün alt naviqasiya çubuğu.

**Fayl:** `src/components/layout/BottomTabs.jsx`

**Xüsusiyyətlər:**
- Yalnız mobil ekranlarda görünür (`lg:hidden`)
- Rola görə filterlənmiş naviqasiya
- Aktiv tab: bordo ikon + etiket
- Sabit alt hissədə yerləşir

---

### Header

Yuxarı başlıq çubuğu.

**Fayl:** `src/components/layout/Header.jsx`

**Məzmun:**
- Sol: Mobil hamburger menü / Desktop sidebar toggle
- Orta: Cari səhifə başlığı (breadcrumb)
- Sağ: Dil seçici + İstifadəçi avatar + Dropdown menü

**Dropdown məzmunu:**
```
Avatar + Ad + Email
──────────────────
Profil
Parametrlər
──────────────────
Çıxış
```

---

### ProtectedRoute

Route səviyyəsində auth və rol yoxlaması.

**Fayl:** `src/components/layout/ProtectedRoute.jsx`

**Props:**

| Prop | Tip | Açıqlama |
|---|---|---|
| `allowedRoles` | `string[]` | Giriş icazəsi olan roller |

**Məntiqi:**
```
Token yoxdur → /login-ə yönləndir
Token var, rol icazəsiz → /dashboard-a yönləndir
Token var, rol icazəli → <Outlet /> render et
```

---

## 4. UI Komponentləri

---

### StatCard

Dashboard statistika kartı.

**Fayl:** `src/components/ui/StatCard.jsx`

**Props:**

| Prop | Tip | Açıqlama |
|---|---|---|
| `title` | `string` | Kart başlığı |
| `value` | `string \| number` | Əsas rəqəm/mətn |
| `icon` | `ReactNode` | Lucide ikonu |
| `trend` | `number` | Artım faizi (müsbət/mənfi) |
| `color` | `'primary' \| 'success' \| 'warning' \| 'info'` | Kart rəngi |
| `isLoading` | `boolean` | Skeleton vəziyyəti |

**İstifadə:**

```jsx
import StatCard from '../components/ui/StatCard';
import { Users, GraduationCap, BookOpen, FlaskConical } from 'lucide-react';

// Admin dashboard
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    title="Müəllimlər"
    value={stats.totalTeachers}
    icon={<Users size={22} />}
    trend={+8}
    color="primary"
    isLoading={isLoading}
  />
  <StatCard
    title="Tələbələr"
    value={stats.totalStudents}
    icon={<GraduationCap size={22} />}
    trend={+15}
    color="success"
    isLoading={isLoading}
  />
  <StatCard
    title="Qruplar"
    value={stats.totalGroups}
    icon={<BookOpen size={22} />}
    color="warning"
    isLoading={isLoading}
  />
  <StatCard
    title="İmtahanlar"
    value={stats.totalExams}
    icon={<FlaskConical size={22} />}
    color="info"
    isLoading={isLoading}
  />
</div>
```

---

### PageHeader

Səhifə başlığı — başlıq + breadcrumb + əməliyyat düymələri.

**Fayl:** `src/components/ui/PageHeader.jsx`

**Props:**

| Prop | Tip | Açıqlama |
|---|---|---|
| `title` | `string` | Səhifə başlığı |
| `subtitle` | `string` | Köməkçi mətn |
| `actions` | `ReactNode` | Sağ tərəfdəki düymələr |
| `breadcrumb` | `string[]` | Naviqasiya yolu |

**İstifadə:**

```jsx
import PageHeader from '../components/ui/PageHeader';
import { Plus } from 'lucide-react';

<PageHeader
  title="Müəllimlər"
  subtitle="Cəmi 12 müəllim"
  breadcrumb={['Dashboard', 'Müəllimlər']}
  actions={
    <Button
      variant="primary"
      icon={<Plus size={16} />}
      onClick={openInviteModal}
    >
      Dəvət göndər
    </Button>
  }
/>
```

---

### SearchBar

Axtarış sahəsi — debounce ilə.

**Fayl:** `src/components/ui/SearchBar.jsx`

**Props:**

| Prop | Tip | Default | Açıqlama |
|---|---|---|---|
| `placeholder` | `string` | `'Axtar...'` | Placeholder mətn |
| `onSearch` | `function` | — | Axtarış callback (300ms debounce) |
| `value` | `string` | — | Kontrol edilən dəyər |

**İstifadə:**

```jsx
import SearchBar from '../components/ui/SearchBar';
import { useState } from 'react';

const [search, setSearch] = useState('');

<SearchBar
  placeholder="Ad və ya email ilə axtar..."
  onSearch={setSearch}
  value={search}
/>
```

---

### LanguageSwitcher

Dil seçici — AZ / EN / RU.

**Fayl:** `src/components/ui/LanguageSwitcher.jsx`

**Davranış:**
- Cari dili göstərir (bayraq + kod)
- Dropdown açılır: AZ, EN, RU seçimləri
- Seçim i18next-ə tətbiq olunur
- localStorage-da saxlanır

**İstifadə:**

```jsx
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

// Header-ə əlavə edilir
<Header>
  <LanguageSwitcher />
</Header>
```

---

## 5. Forma Pattern-ləri

### Standart CRUD Forması

```jsx
// Bütün create/edit formlarında eyni pattern:

import { useForm }     from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z }           from 'zod';
import Button          from '../common/Button';
import Input           from '../common/Input';

const schema = z.object({
  name:    z.string().min(2, 'Ad minimum 2 simvol olmalıdır'),
  email:   z.string().email('Düzgün email daxil edin'),
});

const CreateTeacherForm = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const onFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
      <Input
        label="Ad Soyad"
        required
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Email"
        type="email"
        required
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="ghost" type="button" onClick={onClose}>
          Ləğv et
        </Button>
        <Button variant="primary" type="submit" isLoading={isLoading}>
          Yadda saxla
        </Button>
      </div>
    </form>
  );
};
```

---

## 6. Tailwind Rəng Konfiqurasiyası

```javascript
// tailwind.config.js

module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#800020',
          dark:    '#5a0016',
          light:   '#a3002a',
          50:      '#fff0f3',
          100:     '#ffd6de',
        },
        gray: {
          50:  '#F9F9F9',
          100: '#F0F0F0',
          200: '#E0E0E0',
          300: '#C8C8C8',
          400: '#A0A0A0',
          500: '#787878',
          600: '#585858',
          700: '#444444',
          800: '#2A2A2A',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        dropdown: '0 4px 16px rgba(0,0,0,0.12)',
      },
    },
  },
};
```

---

## 7. İkon İstifadə Qaydaları

Bütün ikonlar **Lucide React** kitabxanasından gəlir. Emoji istifadə olunmur.

```bash
npm install lucide-react
```

**Standart ölçülər:**

| Kontekst | Ölçü |
|---|---|
| Sidebar naviqasiya | `size={20}` |
| Düymə içi | `size={16}` |
| StatCard | `size={22}` |
| EmptyState | `size={40}` |
| PageHeader başlıq | `size={24}` |

**Tez-tez istifadə olunan ikonlar:**

```jsx
import {
  LayoutDashboard,  // Dashboard
  Users,            // Müəllimlər
  GraduationCap,    // Tələbələr
  BookOpen,         // Qruplar
  Calendar,         // Cədvəl
  ClipboardList,    // Ev tapşırıqları
  BookMarked,       // Sinif işləri
  FlaskConical,     // İmtahanlar
  Mail,             // Dəvətlər
  UserCircle,       // Profil
  Settings,         // Parametrlər
  Plus,             // Əlavə et
  Pencil,           // Düzəlt
  Trash2,           // Sil
  Search,           // Axtar
  ChevronLeft,      // Sidebar bağla
  ChevronRight,     // Sidebar aç
  LogOut,           // Çıxış
  Eye, EyeOff,      // Şifrə göster/gizlət
  Check,            // Uğurlu
  X,                // Bağla / Ləğv et
  AlertCircle,      // Xəbərdarlıq
  Inbox,            // Boş hal
  RefreshCw,        // Yenilə
  Download,         // Yüklə
  Upload,           // Yüklə (fayl)
  Filter,           // Filtr
  SortAsc,          // Artan sırala
  Globe,            // Dil seçici
} from 'lucide-react';
```
