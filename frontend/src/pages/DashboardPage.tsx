import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { downloadCsv } from '../utils/csv';

interface TicketUser { id: number; name: string; email: string; }
interface Category { id: number; name: string; }
interface Ticket {
  id: number; title: string; description: string;
  type: 'INCIDENT' | 'SERVICE_REQUEST';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  service?: string | null;
  slaResponseDueAt?: string | null;
  slaResolveDueAt?: string | null;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  location?: string | null;
  resolutionSummary?: string | null;
  rootCause?: string | null;
  closureCode?: string | null;
  escalationReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  creator: TicketUser; technician?: TicketUser | null;
  category: Category; comments: { id: number }[];
}

const STATUS_LABEL = { OPEN: 'Abierto', IN_PROGRESS: 'En proceso', WAITING_USER: 'Espera usuario', ESCALATED: 'Escalado', RESOLVED: 'Resuelto', CLOSED: 'Cerrado' };
const STATUS_CLASS = { OPEN: 'badge-open', IN_PROGRESS: 'badge-progress', WAITING_USER: 'badge-waiting', ESCALATED: 'badge-high', RESOLVED: 'badge-resolved', CLOSED: 'badge-closed' };
const PRIORITY_LABEL = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };
const PRIORITY_CLASS = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const TYPE_LABEL = { INCIDENT: 'Incidente', SERVICE_REQUEST: 'Solicitud' };

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function isSlaBreached(ticket: Ticket) {
  if (['RESOLVED', 'CLOSED'].includes(ticket.status)) return false;
  return Boolean(ticket.slaResolveDueAt && new Date(ticket.slaResolveDueAt) < new Date());
}

function isSlaAtRisk(ticket: Ticket) {
  if (!ticket.slaResolveDueAt || ['RESOLVED', 'CLOSED'].includes(ticket.status)) return false;
  const due = new Date(ticket.slaResolveDueAt).getTime();
  const now = Date.now();
  return due > now && due - now <= 4 * 60 * 60 * 1000;
}

function slaLabel(ticket: Ticket) {
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return 'Cumplido';
  if (isSlaBreached(ticket)) return 'Vencido';
  if (isSlaAtRisk(ticket)) return 'En riesgo';
  return 'En plazo';
}

function formatCsvDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleString('es-CO');
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Ticket[]>('/tickets', { token });
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los tickets');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const totals = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    escalated: tickets.filter(t => t.status === 'ESCALATED').length,
    breached: tickets.filter(isSlaBreached).length,
    atRisk: tickets.filter(isSlaAtRisk).length,
  }), [tickets]);

  function handleDownloadTicketsCsv() {
    downloadCsv(
      'tickets',
      [
        'ID',
        'Titulo',
        'Descripcion',
        'Tipo',
        'Estado',
        'Prioridad',
        'Impacto',
        'Urgencia',
        'Categoria',
        'Servicio',
        'Ubicacion',
        'Solicitante',
        'Email solicitante',
        'Tecnico asignado',
        'Email tecnico',
        'SLA respuesta',
        'SLA resolucion',
        'Primera respuesta',
        'Resuelto',
        'Cerrado',
        'Resumen resolucion',
        'Causa raiz',
        'Codigo cierre',
        'Motivo escalamiento',
        'Comentarios',
        'Creado',
        'Actualizado'
      ],
      tickets.map((ticket) => [
        ticket.id,
        ticket.title,
        ticket.description,
        TYPE_LABEL[ticket.type],
        STATUS_LABEL[ticket.status],
        PRIORITY_LABEL[ticket.priority],
        ticket.impact,
        ticket.urgency,
        ticket.category.name,
        ticket.service,
        ticket.location,
        ticket.creator.name,
        ticket.creator.email,
        ticket.technician?.name,
        ticket.technician?.email,
        formatCsvDate(ticket.slaResponseDueAt),
        formatCsvDate(ticket.slaResolveDueAt),
        formatCsvDate(ticket.firstResponseAt),
        formatCsvDate(ticket.resolvedAt),
        formatCsvDate(ticket.closedAt),
        ticket.resolutionSummary,
        ticket.rootCause,
        ticket.closureCode,
        ticket.escalationReason,
        ticket.comments.length,
        formatCsvDate(ticket.createdAt),
        formatCsvDate(ticket.updatedAt)
      ])
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{user?.role === 'TECHNICIAN' ? 'Panel de técnico' : 'Mi panel'}</h2>
          <p>Consulta y da seguimiento a los casos de soporte</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
          Nuevo ticket
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total tickets</div>
          <div className="stat-value">{totals.total}</div>
          <div className="stat-sub">Demanda capturada</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Abiertos</div>
          <div className="stat-value indigo">{totals.open}</div>
          <div className="stat-sub">Pendientes de clasificación</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En proceso</div>
          <div className="stat-value amber">{totals.inProgress}</div>
          <div className="stat-sub">Restauración en curso</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">SLA vencido</div>
          <div className={`stat-value ${totals.breached ? 'red' : 'green'}`}>{totals.breached}</div>
          <div className="stat-sub">{totals.atRisk} en riesgo, {totals.resolved} resueltos</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>{user?.role === 'TECHNICIAN' ? 'Todos los tickets' : 'Mis tickets'}</h3>
          <div className="card-actions">
            <span className="record-count">{tickets.length} registros</span>
            {user?.role === 'TECHNICIAN' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadTicketsCsv}
                disabled={loading || tickets.length === 0}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v7" />
                  <path d="M5 6l3 3 3-3" />
                  <path d="M3 13h10" />
                </svg>
                Descargar CSV
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ margin: '12px 16px' }}>{error}</div>}

        {loading ? (
          <div className="centered" style={{ minHeight: '160px' }}>
            <div className="spinner"></div>
            Cargando tickets...
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>SLA</th>
                  <th>Solicitante</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="td-id">#{ticket.id}</td>
                    <td>
                      <span className="ticket-title-cell">{ticket.title}</span>
                      <span className="table-sub">{ticket.service || 'Servicio no definido'}</span>
                    </td>
                    <td>
                      <span className={`badge ${ticket.type === 'INCIDENT' ? 'badge-open' : 'badge-tech'}`}>
                        {TYPE_LABEL[ticket.type]}
                      </span>
                    </td>
                    <td className="text-muted">{ticket.category.name}</td>
                    <td><span className={`badge ${STATUS_CLASS[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span></td>
                    <td><span className={`badge ${PRIORITY_CLASS[ticket.priority]}`}>{PRIORITY_LABEL[ticket.priority]}</span></td>
                    <td>
                      <span className={`sla-pill ${isSlaBreached(ticket) ? 'danger' : isSlaAtRisk(ticket) ? 'warning' : 'ok'}`}>
                        {slaLabel(ticket)}
                      </span>
                    </td>
                    <td>
                      <div className="creator-cell">
                        <div className="mini-avatar">{initials(ticket.creator.name)}</div>
                        <span>{ticket.creator.name}</span>
                      </div>
                    </td>
                    <td className="record-count" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(ticket.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="link-strong">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
                {!tickets.length && (
                  <tr className="td-empty">
                    <td colSpan={10}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/></svg>
                        No hay tickets registrados todavía.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
