import React, { useEffect, useState } from 'react';
import { fetchTemplates, createTemplate, deleteTemplate } from '../services/template.service';
import { RotaTemplate, DayTemplate } from '../types/template';
import { TemplateBuilder } from '../components/templates/TemplateBuilder';

function createEmptyDay(dayOfWeek: number): DayTemplate {
  return {
    dayOfWeek,
    shifts: [],
  };
}
export function Templates() {
  const [templates, setTemplates] = useState<RotaTemplate[]>([]);
  const [name, setName] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderDays, setBuilderDays] = useState<DayTemplate[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

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
    await createTemplate({ name, days: builderDays });
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
    <div>
      <h2>Rota Templates</h2>
      <ul>
        {templates.map(t => (
          <li key={t._id}>
            {t.name}
            <button onClick={() => handleDelete(t._id)} style={{ marginLeft: 8 }}>Delete</button>
          </li>
        ))}
      </ul>

      <h3>Add Template</h3>
      {!showBuilder ? (
        <form onSubmit={handleStartBuilder}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Template Name"
            required
          />
          <button type="submit">Create Template</button>
        </form>
      ) : (
        <div>
          <TemplateBuilder
            // Pass days state up via callback
            // Use a controlled builderDays state
            days={builderDays}
            setDays={setBuilderDays}
          />
          <button onClick={handleSaveTemplate}>Save Template</button>
          <button onClick={() => { setShowBuilder(false); setBuilderDays([]); }}>Cancel</button>
        </div>
      )}
    </div>
  );
}
