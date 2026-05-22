const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '');
const DEMO_STORE_KEY = 'soporteDeskDemoData';

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    return demoFetch<T>(endpoint, options);
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || 'Ocurrio un error en la solicitud');
  }

  return data as T;
}

type Role = 'USER' | 'TECHNICIAN';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
type TicketImpact = 'LOW' | 'MEDIUM' | 'HIGH';
type TicketUrgency = 'LOW' | 'MEDIUM' | 'HIGH';
type TicketType = 'INCIDENT' | 'SERVICE_REQUEST';

interface DemoUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
}

interface DemoCategory {
  id: number;
  name: string;
  createdAt: string;
}

interface DemoComment {
  id: number;
  message: string;
  createdAt: string;
  ticketId: number;
  userId: number;
}

interface DemoAudit {
  id: number;
  ticketId: number;
  actorId: number;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  note?: string | null;
  createdAt: string;
}

interface DemoTicket {
  id: number;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  impact: TicketImpact;
  urgency: TicketUrgency;
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
  updatedAt: string;
  creatorId: number;
  technicianId?: number | null;
  categoryId: number;
}

interface DemoStore {
  users: DemoUser[];
  categories: DemoCategory[];
  tickets: DemoTicket[];
  comments: DemoComment[];
  auditEvents: DemoAudit[];
  nextIds: {
    user: number;
    category: number;
    ticket: number;
    comment: number;
    audit: number;
  };
}

function nowIso() {
  return new Date().toISOString();
}

function addHours(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function initialStore(): DemoStore {
  const createdAt = nowIso();
  return {
    users: [
      { id: 1, name: 'Tecnico Mesa de Ayuda', email: 'tech@demo.com', password: '123456', role: 'TECHNICIAN', createdAt },
      { id: 2, name: 'Usuario Demo', email: 'user@demo.com', password: '123456', role: 'USER', createdAt }
    ],
    categories: [
      { id: 1, name: 'Hardware', createdAt },
      { id: 2, name: 'Software', createdAt },
      { id: 3, name: 'Redes', createdAt },
      { id: 4, name: 'Accesos', createdAt }
    ],
    tickets: [
      {
        id: 1,
        title: 'No puedo acceder al correo corporativo',
        description: 'El inicio de sesion falla desde esta manana y necesito enviar reportes del area.',
        type: 'INCIDENT',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        impact: 'HIGH',
        urgency: 'HIGH',
        service: 'Correo corporativo',
        location: 'Sede norte',
        slaResponseDueAt: addHours(2),
        slaResolveDueAt: addHours(8),
        firstResponseAt: createdAt,
        createdAt,
        updatedAt: createdAt,
        creatorId: 2,
        technicianId: 1,
        categoryId: 4
      },
      {
        id: 2,
        title: 'Solicitud de instalacion de editor PDF',
        description: 'Se requiere instalar un editor PDF para el equipo de cartera.',
        type: 'SERVICE_REQUEST',
        status: 'OPEN',
        priority: 'MEDIUM',
        impact: 'MEDIUM',
        urgency: 'MEDIUM',
        service: 'Software de oficina',
        location: 'Remoto',
        slaResponseDueAt: addHours(4),
        slaResolveDueAt: addHours(24),
        createdAt,
        updatedAt: createdAt,
        creatorId: 2,
        technicianId: null,
        categoryId: 2
      }
    ],
    comments: [
      { id: 1, ticketId: 1, userId: 1, message: 'Se valido el usuario y se esta revisando el bloqueo de acceso.', createdAt }
    ],
    auditEvents: [
      { id: 1, ticketId: 1, actorId: 2, action: 'TICKET_CREATED', note: 'Ticket creado por el usuario', createdAt },
      { id: 2, ticketId: 1, actorId: 1, action: 'STATUS_CHANGED', fromValue: 'OPEN', toValue: 'IN_PROGRESS', createdAt },
      { id: 3, ticketId: 2, actorId: 2, action: 'TICKET_CREATED', note: 'Solicitud creada por el usuario', createdAt }
    ],
    nextIds: { user: 3, category: 5, ticket: 3, comment: 2, audit: 4 }
  };
}

function readStore(): DemoStore {
  const raw = localStorage.getItem(DEMO_STORE_KEY);
  if (!raw) {
    const store = initialStore();
    writeStore(store);
    return store;
  }

  return JSON.parse(raw) as DemoStore;
}

function writeStore(store: DemoStore) {
  localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
}

function publicUser(user: DemoUser) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function tokenFor(user: DemoUser) {
  return `demo-${user.id}`;
}

function requireUser(store: DemoStore, token?: string | null) {
  const id = Number(token?.replace('demo-', ''));
  const user = store.users.find((item) => item.id === id);
  if (!user) {
    throw new Error('Sesion no valida');
  }
  return user;
}

function requireTechnician(user: DemoUser) {
  if (user.role !== 'TECHNICIAN') {
    throw new Error('No tienes permisos para realizar esta accion');
  }
}

function requestBody(options: RequestOptions) {
  return options.body ? JSON.parse(String(options.body)) : {};
}

function calculatePriority(impact: TicketImpact, urgency: TicketUrgency): TicketPriority {
  if (impact === 'HIGH' || urgency === 'HIGH') return 'HIGH';
  if (impact === 'LOW' && urgency === 'LOW') return 'LOW';
  return 'MEDIUM';
}

function hydrateTicket(store: DemoStore, ticket: DemoTicket) {
  const creator = store.users.find((user) => user.id === ticket.creatorId);
  const technician = store.users.find((user) => user.id === ticket.technicianId);
  const category = store.categories.find((item) => item.id === ticket.categoryId);
  const comments = store.comments
    .filter((comment) => comment.ticketId === ticket.id)
    .map((comment) => ({
      id: comment.id,
      message: comment.message,
      createdAt: comment.createdAt,
      user: publicUser(store.users.find((user) => user.id === comment.userId)!)
    }));
  const auditEvents = store.auditEvents
    .filter((event) => event.ticketId === ticket.id)
    .map((event) => ({
      ...event,
      actor: publicUser(store.users.find((user) => user.id === event.actorId)!)
    }));

  return {
    ...ticket,
    creator: publicUser(creator!),
    technician: technician ? publicUser(technician) : null,
    category,
    comments,
    auditEvents
  };
}

async function demoFetch<T>(endpoint: string, options: RequestOptions): Promise<T> {
  const store = readStore();
  const method = (options.method || 'GET').toUpperCase();

  if (endpoint === '/auth/login' && method === 'POST') {
    const { email, password } = requestBody(options);
    const user = store.users.find((item) => item.email === email && item.password === password);
    if (!user) throw new Error('Credenciales invalidas');
    return { user: publicUser(user), token: tokenFor(user) } as T;
  }

  if (endpoint === '/auth/register' && method === 'POST') {
    const { name, email, password } = requestBody(options);
    if (store.users.some((item) => item.email === email)) throw new Error('El correo ya esta registrado');
    const user: DemoUser = { id: store.nextIds.user++, name, email, password, role: 'USER', createdAt: nowIso() };
    store.users.push(user);
    writeStore(store);
    return { user: publicUser(user), token: tokenFor(user) } as T;
  }

  const currentUser = requireUser(store, options.token);

  if (endpoint === '/auth/me' && method === 'GET') {
    return publicUser(currentUser) as T;
  }

  if (endpoint === '/categories' && method === 'GET') {
    return store.categories as T;
  }

  if (endpoint === '/users' && method === 'GET') {
    requireTechnician(currentUser);
    return store.users.map((user) => ({
      ...publicUser(user),
      _count: {
        ticketsCreated: store.tickets.filter((ticket) => ticket.creatorId === user.id).length,
        ticketsAssigned: store.tickets.filter((ticket) => ticket.technicianId === user.id).length
      }
    })) as T;
  }

  if (endpoint === '/users' && method === 'POST') {
    requireTechnician(currentUser);
    const { name, email, password, role } = requestBody(options);
    if (store.users.some((item) => item.email === email)) throw new Error('El correo ya esta registrado');
    store.users.push({ id: store.nextIds.user++, name, email, password, role, createdAt: nowIso() });
    writeStore(store);
    return { message: 'Usuario creado correctamente' } as T;
  }

  const userRoleMatch = endpoint.match(/^\/users\/(\d+)$/);
  if (userRoleMatch && method === 'PATCH') {
    requireTechnician(currentUser);
    const target = store.users.find((item) => item.id === Number(userRoleMatch[1]));
    if (!target) throw new Error('Usuario no encontrado');
    target.role = requestBody(options).role;
    writeStore(store);
    return publicUser(target) as T;
  }

  if (endpoint === '/tickets' && method === 'GET') {
    const tickets = currentUser.role === 'TECHNICIAN'
      ? store.tickets
      : store.tickets.filter((ticket) => ticket.creatorId === currentUser.id);
    return tickets.map((ticket) => hydrateTicket(store, ticket)) as T;
  }

  if (endpoint === '/tickets' && method === 'POST') {
    const body = requestBody(options);
    const createdAt = nowIso();
    const impact = body.impact as TicketImpact;
    const urgency = body.urgency as TicketUrgency;
    const ticket: DemoTicket = {
      id: store.nextIds.ticket++,
      title: body.title,
      description: body.description,
      type: body.type,
      status: 'OPEN',
      priority: calculatePriority(impact, urgency),
      impact,
      urgency,
      service: body.service || null,
      location: body.location || null,
      slaResponseDueAt: addHours(4),
      slaResolveDueAt: addHours(24),
      createdAt,
      updatedAt: createdAt,
      creatorId: currentUser.id,
      technicianId: null,
      categoryId: Number(body.categoryId)
    };
    store.tickets.push(ticket);
    store.auditEvents.push({
      id: store.nextIds.audit++,
      ticketId: ticket.id,
      actorId: currentUser.id,
      action: 'TICKET_CREATED',
      note: 'Ticket creado desde el despliegue demo',
      createdAt
    });
    writeStore(store);
    return hydrateTicket(store, ticket) as T;
  }

  const ticketMatch = endpoint.match(/^\/tickets\/(\d+)$/);
  if (ticketMatch && method === 'GET') {
    const ticket = store.tickets.find((item) => item.id === Number(ticketMatch[1]));
    if (!ticket) throw new Error('Ticket no encontrado');
    if (currentUser.role !== 'TECHNICIAN' && ticket.creatorId !== currentUser.id) throw new Error('No tienes acceso a este ticket');
    return hydrateTicket(store, ticket) as T;
  }

  if (ticketMatch && method === 'PATCH') {
    requireTechnician(currentUser);
    const ticket = store.tickets.find((item) => item.id === Number(ticketMatch[1]));
    if (!ticket) throw new Error('Ticket no encontrado');
    const body = requestBody(options);
    const previousStatus = ticket.status;
    Object.assign(ticket, {
      status: body.status,
      priority: body.priority,
      impact: body.impact,
      urgency: body.urgency,
      resolutionSummary: body.resolutionSummary || null,
      rootCause: body.rootCause || null,
      closureCode: body.closureCode || null,
      escalationReason: body.escalationReason || null,
      technicianId: ticket.technicianId || currentUser.id,
      firstResponseAt: ticket.firstResponseAt || nowIso(),
      resolvedAt: body.status === 'RESOLVED' ? nowIso() : ticket.resolvedAt,
      closedAt: body.status === 'CLOSED' ? nowIso() : ticket.closedAt,
      updatedAt: nowIso()
    });
    if (previousStatus !== ticket.status) {
      store.auditEvents.push({
        id: store.nextIds.audit++,
        ticketId: ticket.id,
        actorId: currentUser.id,
        action: 'STATUS_CHANGED',
        fromValue: previousStatus,
        toValue: ticket.status,
        createdAt: nowIso()
      });
    }
    writeStore(store);
    return hydrateTicket(store, ticket) as T;
  }

  const commentMatch = endpoint.match(/^\/tickets\/(\d+)\/comments$/);
  if (commentMatch && method === 'POST') {
    const ticketId = Number(commentMatch[1]);
    const ticket = store.tickets.find((item) => item.id === ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');
    const { message } = requestBody(options);
    store.comments.push({ id: store.nextIds.comment++, ticketId, userId: currentUser.id, message, createdAt: nowIso() });
    ticket.updatedAt = nowIso();
    writeStore(store);
    return { message: 'Comentario agregado' } as T;
  }

  throw new Error('Ruta demo no implementada');
}
