import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Category { id: number; name: string; }
interface UserInfo { id: number; name: string; email: string; role?: 'USER' | 'TECHNICIAN'; }
interface CommentItem { id: number; message: string; createdAt: string; user: UserInfo; }
interface AuditEvent {
  id: number;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  note?: string | null;
  createdAt: string;
  actor: UserInfo;
}

interface TicketDetail {
  id: number; title: string; description: string;
  type: 'INCIDENT' | 'SERVICE_REQUEST';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  service?: string | null;
  location?: string | null;
  slaResponseDueAt?: string | null;
  slaResolveDueAt?: string | null;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  resolutionSummary?: string | null;
  rootCause?: string | null;
  closureCode?: string | null;
  escalationReason?: string | null;
  createdAt: string;
  creator: UserInfo; technician?: UserInfo | null;
  category: Category; comments: CommentItem[]; auditEvents: AuditEvent[];
}

const STATUS_LABEL = { OPEN: 'Abierto', IN_PROGRESS: 'En proceso', WAITING_USER: 'Espera usuario', ESCALATED: 'Escalado', RESOLVED: 'Resuelto', CLOSED: 'Cerrado' };
const STATUS_CLASS = { OPEN: 'badge-open', IN_PROGRESS: 'badge-progress', WAITING_USER: 'badge-waiting', ESCALATED: 'badge-high', RESOLVED: 'badge-resolved', CLOSED: 'badge-closed' };
const PRIORITY_LABEL = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };
const IMPACT_LABEL = { LOW: 'Bajo', MEDIUM: 'Medio', HIGH: 'Alto' };
const URGENCY_LABEL = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };
const TYPE_LABEL = { INCIDENT: 'Incidente', SERVICE_REQUEST: 'Solicitud de servicio' };

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return 'No registrado';
  return new Date(value).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function slaState(ticket: TicketDetail) {
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return 'ok';
  if (ticket.slaResolveDueAt && new Date(ticket.slaResolveDueAt) < new Date()) return 'danger';
  if (ticket.slaResolveDueAt && new Date(ticket.slaResolveDueAt).getTime() - Date.now() <= 4 * 60 * 60 * 1000) return 'warning';
  return 'ok';
}

export function TicketDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<TicketDetail['status']>('OPEN');
  const [priority, setPriority] = useState<TicketDetail['priority']>('MEDIUM');
  const [impact, setImpact] = useState<TicketDetail['impact']>('MEDIUM');
  const [urgency, setUrgency] = useState<TicketDetail['urgency']>('MEDIUM');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [closureCode, setClosureCode] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [error, setError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadTicket = useCallback(async () => {
    try {
      const data = await apiFetch<TicketDetail>(`/tickets/${id}`, { token });
      setTicket(data);
      setStatus(data.status);
      setPriority(data.priority);
      setImpact(data.impact);
      setUrgency(data.urgency);
      setResolutionSummary(data.resolutionSummary || '');
      setRootCause(data.rootCause || '');
      setClosureCode(data.closureCode || '');
      setEscalationReason(data.escalationReason || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el ticket');
    }
  }, [id, token]);

  useEffect(() => { loadTicket(); }, [loadTicket]);

  async function handleComment(event: FormEvent) {
    event.preventDefault();
    setCommentError(''); setCommentSuccess(''); setSubmitting(true);
    try {
      await apiFetch(`/tickets/${id}/comments`, { method: 'POST', token, body: JSON.stringify({ message }) });
      setMessage('');
      setCommentSuccess('Comentario agregado');
      await loadTicket();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'No se pudo guardar el comentario');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    setError(''); setUpdateSuccess(''); setUpdating(true);
    try {
      await apiFetch(`/tickets/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          status,
          priority,
          impact,
          urgency,
          resolutionSummary,
          rootCause,
          closureCode,
          escalationReason
        })
      });
      setUpdateSuccess('Ticket actualizado');
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el ticket');
    } finally {
      setUpdating(false);
    }
  }

  if (!ticket && !error) {
    return <div className="centered"><div className="spinner"></div>Cargando ticket...</div>;
  }

  if (error && !ticket) {
    return <div className="centered" style={{ flexDirection: 'column', gap: '12px' }}>
      <p style={{ color: '#DC2626' }}>{error}</p>
      <Link to="/" className="btn btn-secondary">← Volver al dashboard</Link>
    </div>;
  }

  if (!ticket) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/">Dashboard</Link>
            <span className="breadcrumb-divider">/</span>
            <span>Ticket #{ticket.id}</span>
          </div>
          <h2 style={{ maxWidth: '500px' }}>{ticket.title}</h2>
        </div>
        <Link to="/" className="btn btn-secondary btn-sm">← Volver</Link>
      </div>

      <div className="detail-grid">
        {/* Left col: info + update */}
        <div className="content-column">
          <div className="card">
            <div className="card-header">
              <h3>Detalles del ticket</h3>
              <span className={`badge ${STATUS_CLASS[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
            </div>
            <div className="card-body">
              <p className="ticket-description">{ticket.description}</p>

              <div className="detail-meta">
                <div className="meta-item">
                  <span className="meta-key">ID</span>
                  <span className="meta-val" style={{ fontFamily: 'monospace', color: '#9CA3AF' }}>#{ticket.id}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Tipo</span>
                  <span className="meta-val">{TYPE_LABEL[ticket.type]}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Prioridad</span>
                  <span className="meta-val">
                    <span className={`badge badge-${ticket.priority.toLowerCase()}`}>{PRIORITY_LABEL[ticket.priority]}</span>
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Impacto / urgencia</span>
                  <span className="meta-val">{IMPACT_LABEL[ticket.impact]} / {URGENCY_LABEL[ticket.urgency]}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Categoría</span>
                  <span className="meta-val">{ticket.category.name}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Servicio</span>
                  <span className="meta-val">{ticket.service || 'No definido'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Ubicación</span>
                  <span className="meta-val">{ticket.location || 'No definida'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Fecha</span>
                  <span className="meta-val">{new Date(ticket.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">SLA respuesta</span>
                  <span className="meta-val">{formatDate(ticket.slaResponseDueAt)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">SLA resolución</span>
                  <span className="meta-val">
                    <span className={`sla-pill ${slaState(ticket)}`}>{formatDate(ticket.slaResolveDueAt)}</span>
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Solicitante</span>
                  <div className="inline-user">
                    <div className="mini-avatar">{initials(ticket.creator.name)}</div>
                    <span className="meta-val">{ticket.creator.name}</span>
                  </div>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Técnico asignado</span>
                  {ticket.technician ? (
                    <div className="inline-user">
                      <div className="mini-avatar" style={{ background: '#F5F3FF', color: '#5B21B6' }}>{initials(ticket.technician.name)}</div>
                      <span className="meta-val">{ticket.technician.name}</span>
                    </div>
                  ) : (
                    <span className="meta-val" style={{ color: '#9CA3AF' }}>Sin asignar</span>
                  )}
                </div>
              </div>

              {(ticket.resolutionSummary || ticket.rootCause || ticket.closureCode) && (
                <div className="resolution-box">
                  <h3>Resolución documentada</h3>
                  {ticket.resolutionSummary && <p>{ticket.resolutionSummary}</p>}
                  <div className="resolution-meta">
                    {ticket.rootCause && <span>Causa: {ticket.rootCause}</span>}
                    {ticket.closureCode && <span>Código: {ticket.closureCode}</span>}
                    {ticket.resolvedAt && <span>Resuelto: {formatDate(ticket.resolvedAt)}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {user?.role === 'TECHNICIAN' && (
            <div className="card">
              <div className="card-header"><h3>Actualizar ticket</h3></div>
              <div className="card-body">
                <div className="update-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Estado</label>
                    <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as TicketDetail['status'])}>
                      <option value="OPEN">Abierto</option>
                      <option value="IN_PROGRESS">En proceso</option>
                      <option value="WAITING_USER">En espera del usuario</option>
                      <option value="ESCALATED">Escalado</option>
                      <option value="RESOLVED">Resuelto</option>
                      <option value="CLOSED">Cerrado</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Prioridad</label>
                    <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as TicketDetail['priority'])}>
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  </div>
                </div>
                <div className="update-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Impacto</label>
                    <select className="form-select" value={impact} onChange={(e) => setImpact(e.target.value as TicketDetail['impact'])}>
                      <option value="LOW">Bajo</option>
                      <option value="MEDIUM">Medio</option>
                      <option value="HIGH">Alto</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Urgencia</label>
                    <select className="form-select" value={urgency} onChange={(e) => setUrgency(e.target.value as TicketDetail['urgency'])}>
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Resumen de resolución</label>
                  <textarea className="form-textarea" rows={3} value={resolutionSummary} onChange={(e) => setResolutionSummary(e.target.value)} placeholder="Qué se hizo para restaurar el servicio..." />
                </div>
                <div className="update-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Causa raíz / causa probable</label>
                    <input className="form-input" value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="Ej: Perfil corrupto, cableado, permisos" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Código de cierre</label>
                    <input className="form-input" value={closureCode} onChange={(e) => setClosureCode(e.target.value)} placeholder="Resuelto, workaround, duplicado" />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Motivo de escalamiento</label>
                  <input className="form-input" value={escalationReason} onChange={(e) => setEscalationReason(e.target.value)} placeholder="Solo si el caso requiere otro grupo o mayor prioridad" />
                </div>
                {error && <div className="alert alert-error" style={{ marginTop: '10px', marginBottom: '10px' }}>{error}</div>}
                {updateSuccess && <div className="alert alert-success" style={{ marginTop: '10px', marginBottom: '10px' }}>✓ {updateSuccess}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button className="btn btn-primary" onClick={handleUpdate} disabled={updating}>
                    {updating ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right col: comments + audit */}
        <div className="content-column">
          <div className="card">
            <div className="card-header">
              <h3>Comentarios</h3>
              <span className="record-count">{ticket.comments.length} mensajes</span>
            </div>
            <div className="card-body">
              <div className="comments-list">
                {ticket.comments.map((comment) => (
                  <div key={comment.id} className={`comment-item ${comment.user.role === 'TECHNICIAN' ? 'comment-tech' : ''}`}>
                    <div className="comment-header">
                      <div className="mini-avatar" style={comment.user.role === 'TECHNICIAN' ? { background: '#F5F3FF', color: '#5B21B6' } : {}}>
                        {initials(comment.user.name)}
                      </div>
                      <span className="comment-name">{comment.user.name}</span>
                      {comment.user.role === 'TECHNICIAN' && (
                        <span className="badge badge-tech" style={{ fontSize: '10px' }}>Técnico</span>
                      )}
                      <span className="comment-time">
                        {new Date(comment.createdAt).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="comment-text">{comment.message}</p>
                  </div>
                ))}
                {!ticket.comments.length && (
                  <div className="no-comments">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 8px' }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Sin comentarios todavía
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
                <form onSubmit={handleComment}>
                  <div className="form-group">
                    <label className="form-label">Agregar comentario</label>
                    <textarea
                      className="form-textarea"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="Escribe una respuesta o actualización..."
                      required
                    />
                  </div>
                  {commentError && <div className="alert alert-error" style={{ marginBottom: '10px' }}>{commentError}</div>}
                  {commentSuccess && <div className="alert alert-success" style={{ marginBottom: '10px' }}>✓ {commentSuccess}</div>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Enviando...' : 'Comentar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Bitácora ITIL</h3>
              <span className="record-count">{ticket.auditEvents.length} eventos</span>
            </div>
            <div className="card-body">
              <div className="audit-list">
                {ticket.auditEvents.map((event) => (
                  <div className="audit-item" key={event.id}>
                    <div className="audit-dot"></div>
                    <div>
                      <div className="audit-title">{event.action.replace(/_/g, ' ')}</div>
                      <div className="audit-meta">
                        {event.actor.name} · {formatDate(event.createdAt)}
                      </div>
                      {(event.fromValue || event.toValue || event.note) && (
                        <div className="audit-note">
                          {event.fromValue && event.toValue ? `${event.fromValue} → ${event.toValue}` : event.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {!ticket.auditEvents.length && <div className="no-comments">Sin eventos registrados</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
