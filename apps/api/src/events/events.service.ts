import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    const { petId, type, description, occurredAt } = createEventDto;

    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException(`Pet with id '${petId}' not found`);
    }

    const parsedOccurredAt = new Date(occurredAt);

    if (isNaN(parsedOccurredAt.getTime())) {
      throw new BadRequestException(`Invalid date format for occurredAt: '${occurredAt}'`);
    }

    return this.prisma.event.create({
      data: {
        petId,
        type,
        description,
        occurredAt: parsedOccurredAt,
      },
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      include: {
        pet: true,
      },
      orderBy: {
        occurredAt: 'desc',
      },
    });
  }
}