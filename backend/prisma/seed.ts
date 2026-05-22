import {
  PrismaClient,
  Role,
  TicketImpact,
  TicketPriority,
  TicketStatus,
  TicketType,
  TicketUrgency
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type TicketCreateData = Parameters<typeof prisma.ticket.create>[0]['data'];

async function createTicketIfMissing(title: string, creatorId: number, data: TicketCreateData) {
  const existingTicket = await prisma.ticket.findFirst({
    where: {
      title,
      creatorId
    },
    select: { id: true }
  });

  if (existingTicket) {
    return existingTicket;
  }

  return prisma.ticket.create({ data });
}

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const hardware = await prisma.category.upsert({
    where: { name: 'Hardware' },
    update: {},
    create: { name: 'Hardware' }
  });

  const software = await prisma.category.upsert({
    where: { name: 'Software' },
    update: {},
    create: { name: 'Software' }
  });

  const network = await prisma.category.upsert({
    where: { name: 'Red' },
    update: {},
    create: { name: 'Red' }
  });

  const technician = await prisma.user.upsert({
    where: { email: 'tech@demo.com' },
    update: {},
    create: {
      name: 'Técnico Demo',
      email: 'tech@demo.com',
      password,
      role: Role.TECHNICIAN
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      name: 'Usuario Demo',
      email: 'user@demo.com',
      password,
      role: Role.USER
    }
  });

  await createTicketIfMissing('Equipo con lentitud', user.id, {
    title: 'Equipo con lentitud',
    description: 'El equipo presenta lentitud al abrir aplicaciones.',
    type: TicketType.INCIDENT,
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    impact: TicketImpact.HIGH,
    urgency: TicketUrgency.MEDIUM,
    service: 'Puesto de trabajo',
    location: 'Sede principal',
    slaResponseDueAt: new Date(Date.now() + 60 * 60 * 1000),
    slaResolveDueAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    creatorId: user.id,
    technicianId: technician.id,
    categoryId: hardware.id,
    comments: {
      create: [
        {
          message: 'Se valida el caso y se agenda revisión.',
          userId: technician.id
        }
      ]
    }
  });

  await createTicketIfMissing('Acceso a sistema', user.id, {
    title: 'Acceso a sistema',
    description: 'No puedo ingresar a la plataforma interna.',
    type: TicketType.SERVICE_REQUEST,
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.MEDIUM,
    impact: TicketImpact.MEDIUM,
    urgency: TicketUrgency.MEDIUM,
    service: 'Aplicaciones internas',
    location: 'Remoto',
    firstResponseAt: new Date(),
    slaResponseDueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
    slaResolveDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    creatorId: user.id,
    technicianId: technician.id,
    categoryId: software.id
  });

  console.log('Seed ejecutado correctamente');
  console.log({ categories: [hardware, software, network], technician, user });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
