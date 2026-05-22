import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Category { id: number; name: string; }

export function NewTicketPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'INCIDENT' | 'SERVICE_REQUEST'>('INCIDENT');
  const [impact, setImpact] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [service, setService] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiFetch<Category[]>('/categories', { token });
        setCategories(data);
        if (data.length) setCategoryId(data[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las categorías');
      }
    }
    loadCategories();
  }, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/tickets', {
        method: 'POST', token,
        body: JSON.stringify({
          title,
          description,
          type,
          impact,
          urgency,
          service,
          location,
          categoryId: Number(categoryId)
        })
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el ticket');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <div className="page-header">
        <div>
          <h2>Nuevo ticket</h2>
          <p>Captura la demanda con datos mínimos de clasificación ITIL</p>
        </div>
        <Link to="/" className="btn btn-secondary">← Volver</Link>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tipo de caso</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'INCIDENT' | 'SERVICE_REQUEST')}
                >
                  <option value="INCIDENT">Incidente</option>
                  <option value="SERVICE_REQUEST">Solicitud de servicio</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Título del problema</label>
              <input
                className="form-input"
                type="text"
                placeholder="Ej: El equipo no enciende"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción detallada</label>
              <textarea
                className="form-textarea"
                placeholder="Explica con el mayor detalle posible qué está ocurriendo, cuándo empezó y qué pasos ya intentaste..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Impacto</label>
                <select
                  className="form-select"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                >
                  <option value="LOW">Bajo - un usuario o impacto menor</option>
                  <option value="MEDIUM">Medio - equipo o servicio parcial</option>
                  <option value="HIGH">Alto - servicio crítico o varios usuarios</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Urgencia</label>
                <select
                  className="form-select"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                >
                  <option value="LOW">Baja - puede planificarse</option>
                  <option value="MEDIUM">Media - requiere atención normal</option>
                  <option value="HIGH">Alta - requiere atención inmediata</option>
                </select>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Servicio afectado</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ej: Correo, red, ERP"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ubicación</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ej: Sede norte, remoto"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginTop: '14px' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
                {error}
              </div>
            )}

            <div className="button-row">
              <Link to="/" className="btn btn-secondary">Cancelar</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
