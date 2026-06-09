import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async create(createPetDto: CreatePetDto) {
    const { userId, name, species, breed, birthDate, weightKg, notes } = createPetDto;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }

    // Parse and validate birthDate if provided
    let parsedBirthDate: Date | null = null;
    if (birthDate) {
      parsedBirthDate = new Date(birthDate);
      if (isNaN(parsedBirthDate.getTime())) {
        throw new BadRequestException(`Invalid date format for birthDate: '${birthDate}'`);
      }
    }

    // Create pet
    const pet = await this.prisma.pet.create({
      data: {
        userId,
        name,
        species,
        breed: breed || null,
        birthDate: parsedBirthDate,
        weightKg: weightKg ?? null,
        notes: notes || null,
      },
    });

    return pet;
  }

  async findAll() {
    return this.prisma.pet.findMany({
      include: {
        user: true,
      },
    });
  }
}
