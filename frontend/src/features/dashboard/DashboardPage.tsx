import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStaff } from '@/services/staff.service';
import { fetchTemplates } from '@/services/template.service';
import { fetchRotas } from '@/services/rota.service';
import { getStartOfWeek } from '@/utils/weekUtils';
import { Card, Button, EmptyState, PageContainer } from '@/ui';

// ─── Data shapes ────────────────────────────────────────────────────────────

interface DashboardStats {
  totalStaff:     number;
  publishedRotas: number;
  draftRotas:     number;
  templates:      number;
}

interface Alert {
  id:      string;
  message: string;
  level:   'warning' | 'error';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <div className="flex flex-col">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-gray-900 mt-1">{value}</p>
      </div>
    </Card>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const isError = alert.level === 'error';
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0">
      <AlertIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isError ? 'text-red-500' : 'text-amber-500'}`} />
      <p className="text-sm text-gray-700">{alert.message}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0, publishedRotas: 0, draftRotas: 0, templates: 0,
  });
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const weekStart = getStartOfWeek(new Date());
        const [staff, templates, rotas] = await Promise.all([
          fetchStaff(),
          fetchTemplates(),
          fetchRotas(weekStart),
        ]);

        const publishedThisWeek = rotas.filter(
          r => r.status === 'published' && r.weekStartDate === weekStart
        );
        const draftThisWeek = rotas.filter(
          r => r.status === 'draft' && r.weekStartDate === weekStart
        );

        setStats({
          totalStaff:     staff.length,
          publishedRotas: publishedThisWeek.length,
          draftRotas:     draftThisWeek.length,
          templates:      templates.length,
        });

        // Derive operational alerts from fetched data
        const derived: Alert[] = [];

        if (publishedThisWeek.length === 0) {
          derived.push({
            id:      'no-published-rota',
            message: 'No published rota for the current week.',
            level:   'warning',
          });
        }
        if (draftThisWeek.length > 0 && publishedThisWeek.length === 0) {
          derived.push({
            id:      'draft-pending',
            message: `${draftThisWeek.length} draft rota${draftThisWeek.length > 1 ? 's' : ''} awaiting publish.`,
            level:   'warning',
          });
        }
        if (staff.length === 0) {
          derived.push({
            id:      'no-staff',
            message: 'No staff members added. Add staff before building rotas.',
            level:   'warning',
          });
        }
        if (templates.length === 0) {
          derived.push({
            id:      'no-templates',
            message: 'No shift templates found. Create a template to get started.',
            level:   'warning',
          });
        }

        setAlerts(derived);
        setError(null);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="h-16 animate-pulse bg-gray-100 rounded" />
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Staff"     value={stats.totalStaff} />
          <StatCard label="Published Rotas" value={stats.publishedRotas} />
          <StatCard label="Draft Rotas"     value={stats.draftRotas} />
          <StatCard label="Templates"       value={stats.templates} />
        </div>

        {/* ── Alerts + Quick Actions ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Operational Alerts */}
          <Card title="Operational Alerts" bodyClassName="p-0">
            {alerts.length === 0 ? (
              <EmptyState
                title="All clear"
                description="No issues detected this week."
              />
            ) : (
              <div>
                {alerts.map(alert => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary"   onClick={() => navigate('/rota')}>
                Create Rota
              </Button>
              <Button variant="secondary" onClick={() => navigate('/staff')}>
                Add Staff
              </Button>
              <Button variant="secondary" onClick={() => navigate('/templates')}>
                Create Template
              </Button>
              <Button variant="secondary" onClick={() => navigate('/locations')}>
                Add Location
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </PageContainer>
  );
}
