import { useState } from 'react';
import { Plus, Edit2, Trash2, Tags, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  categoryName,
  slugify,
} from '../../features/categories/categoriesApi';
import { Button, Card, EmptyState, FormField, Input, Modal, PageShell, Skeleton, Table } from '../../components/ui';

const EMPTY = { nameAz: '', nameEn: '', nameRu: '', slug: '' };

/**
 * Categories (admin) — the course categories shared with the landing site. Changes go to the landing API through
 * the LMS server, so the course form here and the landing catalogue use the same list.
 */
const Categories = () => {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError, refetch } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);

  const categories = data?.data ?? [];
  const saving = isCreating || isUpdating;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({ nameAz: category.nameAz, nameEn: category.nameEn, nameRu: category.nameRu, slug: category.slug });
    setSlugTouched(true);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditing(null);
  };

  const setNameAz = (value) =>
    setForm((f) => ({ ...f, nameAz: value, slug: slugTouched ? f.slug : slugify(value) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nameAz: form.nameAz.trim(),
      nameEn: form.nameEn.trim(),
      nameRu: form.nameRu.trim(),
      slug: slugify(form.slug),
    };
    try {
      if (editing) {
        await updateCategory({ id: editing.id, ...payload }).unwrap();
        toast.success(t('categories.updateSuccess'));
      } else {
        await createCategory(payload).unwrap();
        toast.success(t('categories.addSuccess'));
      }
      close();
    } catch (error) {
      toast.error(error.data?.message || t('categories.error'));
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(t('categories.deleteConfirm', { name: categoryName(category, i18n.language) }))) return;
    try {
      await deleteCategory(category.id).unwrap();
      toast.success(t('categories.deleteSuccess'));
    } catch (error) {
      toast.error(error.data?.message || t('categories.error'));
    }
  };

  return (
    <PageShell
      title={t('categories.title')}
      subtitle={t('categories.subtitle')}
      actions={
        <Button onClick={openCreate} icon={Plus}>
          {t('categories.new')}
        </Button>
      }
    >
      <Card className="p-4 sm:p-6">
        <p className="mb-4 flex items-start gap-2 text-[0.95rem] text-ink-muted">
          <Globe size={16} strokeWidth={1.5} className="mt-1 shrink-0 text-accent-text" aria-hidden="true" />
          {t('categories.sharedNote')}
        </p>
        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            sketch="globe"
            title={t('categories.loadError')}
            action={<Button variant="outline" onClick={refetch}>{t('categories.retry')}</Button>}
          />
        ) : categories.length === 0 ? (
          <EmptyState sketch="books" title={t('categories.empty')} />
        ) : (
          <Table caption={t('categories.title')}>
            <thead>
              <tr>
                <th>{t('categories.nameAz')}</th>
                <th>{t('categories.nameEn')}</th>
                <th>{t('categories.nameRu')}</th>
                <th>{t('categories.slug')}</th>
                <th className="text-right">{t('categories.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent-text">
                        <Tags size={15} strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <span className="font-semibold text-ink">{c.nameAz}</span>
                    </div>
                  </td>
                  <td>{c.nameEn}</td>
                  <td>{c.nameRu}</td>
                  <td><code className="text-[0.9rem] text-ink-muted">{c.slug}</code></td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" iconOnly icon={Edit2} motif={false} onClick={() => openEdit(c)} aria-label={t('categories.edit')} />
                      <Button variant="ghost" size="sm" iconOnly icon={Trash2} motif={false} onClick={() => handleDelete(c)} aria-label={t('common.delete')} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        onClose={close}
        title={editing ? t('categories.edit') : t('categories.new')}
        footer={
          <>
            <Button variant="ghost" onClick={close}>{t('users.cancelBtn')}</Button>
            <Button type="submit" form="category-form" loading={saving}>
              {editing ? t('users.saveBtn') : t('categories.create')}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
          <FormField label={t('categories.nameAz')} required>
            <Input required maxLength={255} value={form.nameAz} onChange={(e) => setNameAz(e.target.value)} placeholder="Veb Proqramlaşdırma" />
          </FormField>
          <FormField label={t('categories.nameEn')} required>
            <Input required maxLength={255} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Web Development" />
          </FormField>
          <FormField label={t('categories.nameRu')} required>
            <Input required maxLength={255} value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} placeholder="Веб-разработка" />
          </FormField>
          <FormField label={t('categories.slug')} hint={t('categories.slugHint')} required>
            <Input
              required
              maxLength={255}
              pattern="[a-z0-9_\-]+"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value.toLowerCase() });
              }}
              placeholder="web-development"
            />
          </FormField>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Categories;
