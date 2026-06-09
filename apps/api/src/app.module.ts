import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PrismaModule } from './prisma/prisma.module';
import { PetsModule } from './pets/pets.module';

@Module({
  imports: [PrismaModule, PetsModule, EventsModule, ExpensesModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
