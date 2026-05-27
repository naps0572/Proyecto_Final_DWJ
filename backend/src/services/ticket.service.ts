import {
  Role,
  TicketImpact,
  TicketPriority,
  TicketStatus,
  TicketType,
  TicketUrgency
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/hash';

const createTicketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  type: z.nativeEnum(TicketType).default(TicketType.INCIDENT),
  impact: z.nativeEnum(TicketImpact).default(TicketImpact.MEDIUM),
  urgency: z.nativeEnum(TicketUrgency).default(TicketUrgency.MEDIUM),
  categoryId: z.number().int().positive(),
  service: z.string().trim().max(80).optional().nullable(),
  location: z.string().trim().max(80).optional().nullable()
});

const updateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  impact: z.nativeEnum(TicketImpact).optional(),
  urgency: z.nativeEnum(TicketUrgency).optional(),
  technicianId: z.number().int().positive().nullable().optional(),
  categoryId: z.number().int().positive().optional(),
  service: z.string().trim().max(80).optional().nullable(),
  location: z.string().trim().max(80).optional().nullable(),
  resolutionSummary: z.string().trim().max(1000).optional().nullable(),
  rootCause: z.string().trim().max(1000).optional().nullable(),
  closureCode: z.string().trim().max(80).optional().nullable(),
  escalationReason: z.string().trim().max(500).optional().nullable()
});

const addCommentSchema = z.object({
  message: z.string().min(2)
});

const botTicketSchema = z.object({
  requesterName: z.string().trim().min(2).max(120).optional().nullable(),
  requesterEmail: z.string().trim().email(),
  requesterPhone: z.string().trim().max(40).optional().nullable(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5),
  type: z.nativeEnum(TicketType).default(TicketType.INCIDENT),
  impact: z.nativeEnum(TicketImpact).default(TicketImpact.MEDIUM),
  urgency: z.nativeEnum(TicketUrgency).default(TicketUrgency.MEDIUM),
  categoryName: z.string().trim().min(2).max(80).default('General'),
  service: z.string().trim().max(80).optional().nullable(),
  location: z.string().trim().max(80).optional().nullable(),
  source: z.string().trim().max(80).default('bot-whatsapp-service-desk')
});

const PRIORITY_MATRIX: Record<TicketImpact, Record<TicketUrgency, TicketPriority>> = {
  LOW: {
    LOW: TicketPriority.LOW,
    MEDIUM: TicketPriority.LOW,
    HIGH: TicketPriority.MEDIUM
  },
  MEDIUM: {
    LOW: TicketPriority.LOW,
    MEDIUM: TicketPriority.MEDIUM,
    HIGH: TicketPriority.HIGH
  },
  HIGH: {
    LOW: TicketPriority.MEDIUM,
    MEDIUM: TicketPriority.HIGH,
    HIGH: TicketPriority.HIGH
  }
};

const SLA_HOURS: Record<TicketPriority, { response: number; resolve: number }> = {
  HIGH: { response: 1, resolve: 8 },
  MEDIUM: { response: 4, resolve: 24 },
  LOW: { response: 8, resolve: 72 }
};

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function calculatePriority(impact: TicketImpact, urgency: TicketUrgency) {
  return PRIORITY_MATRIX[impact][urgency];
}

function calculateSla(priority: TicketPriority, baseDate = new Date()) {
  const sla = SLA_HOURS[priority];
  return {
    slaResponseDueAt: addHours(baseDate, sla.response),
    slaResolveDueAt: addHours(baseDate, sla.resolve)
  };
}

function hasChanged<T>(before: T, after: T | undefined) {
  return after !== undefined && before !== after;
}

export async function getTickets(userId: number, role: Role) {
  return prisma.ticket.findMany({
    where: role === Role.TECHNICIAN ? {} : { creatorId: userId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      technician: { select: { id: true, name: true, email: true } },
      category: true,
      comments: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getTicketById(ticketId: number, userId: number, role: Role) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      technician: { select: { id: true, name: true, email: true } },
      category: true,
      comments: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'asc' }
      },
      auditEvents: {
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!ticket) {
    throw new Error('Ticket no encontrado');
  }

  if (role !== Role.TECHNICIAN && ticket.creatorId !== userId) {
    throw new Error('No tienes permisos para ver este ticket');
  }

  return ticket;
}

export async function createTicket(input: unknown, creatorId: number) {
  const data = createTicketSchema.parse(input);
  const priority = calculatePriority(data.impact, data.urgency);
  const createdAt = new Date();
  const sla = calculateSla(priority, createdAt);

  return prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      priority,
      impact: data.impact,
      urgency: data.urgency,
      service: data.service || null,
      location: data.location || null,
      ...sla,
      categoryId: data.categoryId,
      creatorId,
      auditEvents: {
        create: {
          actorId: creatorId,
          action: 'CREATED',
          toValue: priority,
          note: 'Ticket registrado desde el portal de mesa de ayuda'
        }
      }
    },
    include: {
      category: true,
      creator: { select: { id: true, name: true, email: true } }
    }
  });
}

export async function createTicketFromBot(input: unknown) {
  const data = botTicketSchema.parse(input);
  const priority = calculatePriority(data.impact, data.urgency);
  const createdAt = new Date();
  const sla = calculateSla(priority, createdAt);

  const [creator, category] = await Promise.all([
    prisma.user.upsert({
      where: { email: data.requesterEmail },
      update: {
        name: data.requesterName || data.requesterEmail
      },
      create: {
        name: data.requesterName || data.requesterEmail,
        email: data.requesterEmail,
        password: await hashPassword(`bot-${randomUUID()}`),
        role: Role.USER
      }
    }),
    prisma.category.upsert({
      where: { name: data.categoryName },
      update: {},
      create: { name: data.categoryName }
    })
  ]);

  return prisma.ticket.create({
    data: {
      title: data.title,
      description: [
        data.description,
        data.requesterPhone ? `Teléfono WhatsApp: ${data.requesterPhone}` : null
      ]
        .filter(Boolean)
        .join('\n\n'),
      type: data.type,
      priority,
      impact: data.impact,
      urgency: data.urgency,
      service: data.service || null,
      location: data.location || null,
      ...sla,
      categoryId: category.id,
      creatorId: creator.id,
      auditEvents: {
        create: {
          actorId: creator.id,
          action: 'CREATED',
          toValue: priority,
          note: `Ticket registrado desde ${data.source}`
        }
      }
    },
    include: {
      category: true,
      creator: { select: { id: true, name: true, email: true } }
    }
  });
}

export async function updateTicket(ticketId: number, input: unknown, role: Role, actorId: number) {
  if (role !== Role.TECHNICIAN) {
    throw new Error('Solo el técnico puede actualizar tickets');
  }

  const data = updateTicketSchema.parse(input);
  const current = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!current) {
    throw new Error('Ticket no encontrado');
  }

  if (data.categoryId !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new Error('La categoría seleccionada no existe');
    }
  }

  if (data.technicianId !== undefined && data.technicianId !== null) {
    const technician = await prisma.user.findFirst({
      where: {
        id: data.technicianId,
        role: Role.TECHNICIAN
      },
      select: { id: true }
    });

    if (!technician) {
      throw new Error('El técnico asignado no existe o no tiene rol técnico');
    }
  }

  const updateData: {
    status?: typeof data.status;
    priority?: typeof data.priority;
    impact?: typeof data.impact;
    urgency?: typeof data.urgency;
    technicianId?: number | null;
    categoryId?: number;
    service?: string | null;
    location?: string | null;
    firstResponseAt?: Date;
    resolvedAt?: Date | null;
    closedAt?: Date | null;
    resolutionSummary?: string | null;
    rootCause?: string | null;
    closureCode?: string | null;
    escalationReason?: string | null;
    slaResponseDueAt?: Date;
    slaResolveDueAt?: Date;
  } = {};
  const auditEvents: {
    ticketId: number;
    actorId: number;
    action: string;
    fromValue?: string | null;
    toValue?: string | null;
    note?: string | null;
  }[] = [];

  if (data.status !== undefined) {
    updateData.status = data.status;
    if (current.status !== data.status) {
      auditEvents.push({
        ticketId,
        actorId,
        action: 'STATUS_CHANGED',
        fromValue: current.status,
        toValue: data.status
      });
    }

    if (data.status === TicketStatus.IN_PROGRESS && !current.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }
    if (data.status === TicketStatus.RESOLVED && !current.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (data.status === TicketStatus.CLOSED && !current.closedAt) {
      updateData.closedAt = new Date();
      if (!current.resolvedAt) updateData.resolvedAt = new Date();
    }
  }

  const nextImpact = data.impact ?? current.impact;
  const nextUrgency = data.urgency ?? current.urgency;
  const calculatedPriority = calculatePriority(nextImpact, nextUrgency);
  const nextPriority = data.priority ?? calculatedPriority;

  if (data.impact !== undefined) updateData.impact = data.impact;
  if (data.urgency !== undefined) updateData.urgency = data.urgency;
  if (nextPriority !== current.priority) {
    updateData.priority = nextPriority;
    const sla = calculateSla(nextPriority, current.createdAt);
    updateData.slaResponseDueAt = sla.slaResponseDueAt;
    updateData.slaResolveDueAt = sla.slaResolveDueAt;
    auditEvents.push({
      ticketId,
      actorId,
      action: 'PRIORITY_CHANGED',
      fromValue: current.priority,
      toValue: nextPriority,
      note: data.priority ? 'Prioridad ajustada manualmente' : 'Prioridad recalculada por impacto y urgencia'
    });
  }

  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.service !== undefined) updateData.service = data.service || null;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.resolutionSummary !== undefined) updateData.resolutionSummary = data.resolutionSummary || null;
  if (data.rootCause !== undefined) updateData.rootCause = data.rootCause || null;
  if (data.closureCode !== undefined) updateData.closureCode = data.closureCode || null;
  if (data.escalationReason !== undefined) updateData.escalationReason = data.escalationReason || null;

  if ('technicianId' in data) updateData.technicianId = data.technicianId ?? null;
  if (hasChanged(current.technicianId, updateData.technicianId)) {
    auditEvents.push({
      ticketId,
      actorId,
      action: 'ASSIGNMENT_CHANGED',
      fromValue: current.technicianId ? String(current.technicianId) : null,
      toValue: updateData.technicianId ? String(updateData.technicianId) : null
    });
  }

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        category: true,
        creator: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
        auditEvents: {
          include: { actor: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (auditEvents.length) {
      await tx.ticketAudit.createMany({ data: auditEvents });
    }

    return ticket;
  });
}

export async function addComment(ticketId: number, input: unknown, userId: number, role: Role) {
  const data = addCommentSchema.parse(input);

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new Error('Ticket no encontrado');
  }

  if (role !== Role.TECHNICIAN && ticket.creatorId !== userId) {
    throw new Error('No tienes permisos para comentar este ticket');
  }

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        message: data.message,
        ticketId,
        userId
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    if (role === Role.TECHNICIAN && !ticket.firstResponseAt) {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { firstResponseAt: new Date() }
      });
      await tx.ticketAudit.create({
        data: {
          ticketId,
          actorId: userId,
          action: 'FIRST_RESPONSE',
          note: 'Primera respuesta registrada por el equipo técnico'
        }
      });
    }

    return comment;
  });
}
