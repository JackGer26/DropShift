import React, { useEffect, useState } from 'react';
import { fetchTemplates, createTemplate, deleteTemplate } from '@/services/template.service';
import { RotaTemplate, DayTemplate } from '@/types/template';
import { TemplateBuilder } from './components/TemplateBuilder';
import { Button, Card, EmptyState, FormField, Input, PageContainer, RoleBadge } from '@/ui';

const DAY_NAMES: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

function createEmptyDay(dayOfWeek: number): DayTemplate {
  return { dayOfWeek, shifts: [] };
}

// Set your default locationId here (should be a valid 24-char ObjectId)
const DEFAULT_LOCATION_ID = '699094c87ec69da4f15fc047';

export function TemplatesPage() {
  const [templates, setTemplates]     = useState<RotaTemplate[]>([]);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [name, setName]               = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderDays, setBuilderDays] = useState<DayTemplate[]>([]);

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    const data = await fetchTemplates();
    setTemplates(data);
  }

  function handleStartBuilder(e: React.FormEvent) {
    e.preventDefault();
    setBuilderDays(Array.from({ length: 7 }, (_, i) => createEmptyDay(i)));
    setShowBuilder(true);
  }

  async function handleSaveTemplate() {
    await createTemplate({ name, locationId: DEFAULT_LOCATION_ID, days: builderDays });
    setName('');
    setShowBuilder(false);
    setBuilderDays([]);
    await loadTemplates();
  }

  async function handleDelete(id: string) {
    await deleteTemplate(id);
    await loadTemplates();
  }

  return (
    <PageContainer title="Templates">
      {/* Template list */}
      <Card bodyClassName="divide-y divide-gray-100">
        {templates.map(t => {
          const isExpanded = expandedId === t._id;
          const activeDays = t.days.filter(d => d.shifts.length > 0);
          return (
            <div key={t._id}>
              {/* Row header — clickable */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : t._id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-sm font-medium text-gray-800">{t.name}</span>
                  <span className="text-xs text-gray-400">
                    {activeDays.length} day{activeDays.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={e => { e.stopPropagation(); handleDelete(t._id); }}
                >
                  Delete
                </Button>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  {activeDays.length === 0 ? (
                    <p className="text-xs text-gray-400 pt-3">No shifts defined in this template.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-3">
                      {activeDays.map(day => (
                        <div key={day.dayOfWeek}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            {DAY_NAMES[day.dayOfWeek]}
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {day.shifts.map(shift => (
                              <div
                                key={shift.id}
                                className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
                              >
                                <p className="font-medium text-gray-700">{shift.startTime} – {shift.endTime}</p>
                                <div className="mt-0.5 flex items-center gap-1">
                                  <RoleBadge role={shift.roleRequired} />
                                  <span className="text-gray-400">×{shift.quantityRequired}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {templates.length === 0 && (
          <EmptyState title="No templates yet" description="Create your first template using the form below." />
        )}
      </Card>

      {/* Add template */}
      <Card title="New Template" className="mt-5">
        {!showBuilder ? (
          <form onSubmit={handleStartBuilder} className="flex flex-wrap items-start gap-3">
            <FormField label="Template Name" htmlFor="template-name">
              <Input
                id="template-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Summer Rota"
                required
              />
            </FormField>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-gray-700 invisible" aria-hidden="true">&#8203;</span>
              <Button type="submit" variant="primary">Create Template</Button>
              <div className="min-h-[1.25rem]" />
            </div>
          </form>
        ) : (
          <div>
            <TemplateBuilder days={builderDays} setDays={setBuilderDays} templateName={name} />
            <div className="flex items-center gap-2 mt-4">
              <Button variant="primary" onClick={handleSaveTemplate}>Save Template</Button>
              <Button variant="secondary" onClick={() => { setShowBuilder(false); setBuilderDays([]); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
