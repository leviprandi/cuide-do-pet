import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto) {
    const { userId, item, category, amount, purchasedAt, quantity, unit } = createExpenseDto;

    // Camada de Repository
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }

    const parsedPurchasedAt = new Date(purchasedAt);

    if (isNaN(parsedPurchasedAt.getTime())) {
      throw new BadRequestException(`Invalid date format for purchasedAt: '${purchasedAt}'`);
    }

    // Criar um service
    const pricePerKg =
      unit === 'kg' && quantity != null && quantity > 0
        ? amount / quantity
        : null;

    return this.prisma.expense.create({
      data: {
        userId,
        item,
        category,
        amount,
        purchasedAt: parsedPurchasedAt,
        quantity: quantity ?? null,
        unit: unit ?? null,
        pricePerKg,
      },
    });
  }

  async findAll() {
    return this.prisma.expense.findMany({
      include: {
        user: true,
      },
      orderBy: {
        purchasedAt: 'desc',
      },
    });
  }
}
