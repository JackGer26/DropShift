import React, { useEffect, useState } from 'react';
import { fetchTemplates, createTemplate, deleteTemplate } from '@/services/template.service';
import { RotaTemplate, DayTemplate } from '@/types/template';
import { TemplateBuilder } from './components/TemplateBuilder';
import { Button, Card, EmptyState, FormField, Input, PageContainer } from '@/ui';

function createEmptyDay(dayOfWeek: number): DayTemplate {
  return { dayOfWeek, shifts: [] };
}

// Set your default locationId here (should be a valid 24-char ObjectId)
const DEFAULT_LOCATION_ID = '699094c87ec69da4f15fc047';

export function TemplatesPage() {
  const [templates, setTemplates]     = useState<RotaTemplate[]>([]);
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
        {templates.map(t => (
          <div key={t._id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-gray-800">{t.name}</span>
            <Button variant="danger" size="sm" onClick={() => handleDelete(t._id)}>
              Delete
            </Button>
          </div>
        ))}
        {templates.length === 0 && (
          <EmptyState title="No templates yet" description="Create your first template using the form below." />
        )}
      </Card>

      {/* Add template */}
      <Card title="New Template" className="mt-5">
        {!showBuilder ? (
          <form onSubmit={handleStartBuilder} className="flex flex-wrap items-end gap-3">
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
            <Button type="submit" variant="primary">Create Template</Button>
          </form>
        ) : (
          <div>
            <TemplateBuilder days={builderDays} setDays={setBuilderDays} />
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
