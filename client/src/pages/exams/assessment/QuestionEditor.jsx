import { Controller } from 'react-hook-form';
import { ChevronDown, ChevronUp, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Select from '../../../components/common/Select';
import { Badge, Button, FormField, Input, Textarea } from '../../../components/ui';
import { cn } from '../../../lib/utils';

/**
 * Question list editor shared by ExamModal and QuizModal (same react-hook-form field array).
 * `ns` is the i18n namespace ('exams' | 'quizzes'); the parent owns the form and the
 * expanded-question state.
 */
const QuestionEditor = ({ ns, control, register, watch, fields, append, remove, update, expanded, setExpanded }) => {
  const { t } = useTranslation();
  const typeLabelKey = ns === 'quizzes' ? 'questionType' : 'type';
  const typeLabel = (type) => (type === 'multiple-choice'
    ? t(`${ns}.multipleChoice`)
    : type === 'true-false' ? t(`${ns}.trueFalse`) : t(`${ns}.openEnded`));

  const patch = (index, change) => update(index, { ...watch(`questions.${index}`), ...change });

  return (
    <section className="mt-6 border-t border-line-hair pt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[1.2rem] font-semibold text-ink">
          <MessageSquare size={19} strokeWidth={1.6} aria-hidden="true" className="text-accent-text" />
          {t(`${ns}.questions`)} <span className="num text-ink-muted">({fields.length})</span>
        </h3>
        <Button
          size="sm"
          variant="outline"
          motif={false}
          icon={Plus}
          onClick={() => {
            append({ text: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '0', points: '1' });
            setExpanded(fields.length);
          }}
        >
          {t(`${ns}.addQuestion`)}
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => {
          const open = expanded === index;
          const type = watch(`questions.${index}.type`);
          const correct = watch(`questions.${index}.correctAnswer`);
          return (
            <div key={field.id} className="card overflow-hidden">
              <div className="flex items-center gap-2 pr-2">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : index)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="time-italic w-6 shrink-0 text-[1.3rem] leading-none text-accent-text dark:text-ink">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.98rem] font-medium text-ink">
                    {watch(`questions.${index}.text`) || t(`${ns}.newQuestion`)}
                  </span>
                  <Badge className="hidden sm:inline-flex">{typeLabel(type)}</Badge>
                  {open ? <ChevronUp size={18} aria-hidden="true" className="text-ink-muted" />
                    : <ChevronDown size={18} aria-hidden="true" className="text-ink-muted" />}
                </button>
                <Button
                  variant="ghost"
                  iconOnly
                  size="sm"
                  icon={Trash2}
                  aria-label={t('common.delete')}
                  onClick={() => {
                    remove(index);
                    if (open) setExpanded(null);
                  }}
                />
              </div>

              {open && (
                <div className="orn-reveal space-y-4 border-t border-line-hair px-4 py-4">
                  <FormField label={t(`${ns}.questionText`)}>
                    {(id) => (
                      <Textarea
                        id={id}
                        rows={3}
                        {...register(`questions.${index}.text`)}
                        placeholder={t(`${ns}.questionPlaceholder`)}
                      />
                    )}
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="field-label">{t(`${ns}.${typeLabelKey}`)}</span>
                      <Controller
                        name={`questions.${index}.type`}
                        control={control}
                        render={({ field: f }) => (
                          <Select
                            {...f}
                            onChange={(val) => {
                              f.onChange(val);
                              if (val === 'true-false') {
                                patch(index, { type: val, options: ['Düzdür', 'Səhvdir'], correctAnswer: 'true' });
                              } else if (val === 'multiple-choice') {
                                patch(index, { type: val, options: ['', '', '', ''], correctAnswer: '0' });
                              } else {
                                patch(index, { type: val, options: [], correctAnswer: '' });
                              }
                            }}
                            options={[
                              { label: t(`${ns}.multipleChoice`), value: 'multiple-choice' },
                              { label: t(`${ns}.trueFalse`), value: 'true-false' },
                              { label: t(`${ns}.openEnded`), value: 'open-ended' },
                            ]}
                          />
                        )}
                      />
                    </div>
                    <FormField label={t(`${ns}.points`)}>
                      {(id) => (
                        <Input id={id} type="number" min="1" placeholder="1" {...register(`questions.${index}.points`)} />
                      )}
                    </FormField>
                  </div>

                  {type === 'multiple-choice' && (
                    <fieldset className="space-y-2">
                      <legend className="field-label">
                        {t(`${ns}.options`)} <span className="text-ink-muted">({t(`${ns}.correctOption`)})</span>
                      </legend>
                      {[0, 1, 2, 3].map((optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <input
                            type="radio"
                            className="check"
                            name={`correct-${field.id}`}
                            aria-label={`${t(`${ns}.correctOption`)}: ${String.fromCharCode(65 + optIndex)}`}
                            checked={correct === String(optIndex)}
                            onChange={() => patch(index, { correctAnswer: String(optIndex) })}
                          />
                          <Input
                            aria-label={String.fromCharCode(65 + optIndex)}
                            {...register(`questions.${index}.options.${optIndex}`)}
                            placeholder={`${String.fromCharCode(65 + optIndex)} variantı...`}
                          />
                        </div>
                      ))}
                    </fieldset>
                  )}

                  {type === 'true-false' && (
                    <div role="radiogroup" aria-label={t(`${ns}.correctOption`)} className="flex gap-3">
                      {['true', 'false'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          role="radio"
                          aria-checked={correct === val}
                          onClick={() => patch(index, { correctAnswer: val })}
                          className={cn('btn flex-1', correct === val ? 'btn-primary' : 'btn-outline')}
                        >
                          {t(`${ns}.${val}`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default QuestionEditor;
