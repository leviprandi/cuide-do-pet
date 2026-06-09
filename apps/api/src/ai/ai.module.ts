import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { EventsModule } from '../events/events.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { DeterministicAiProvider } from './providers/deterministic-ai.provider';

@Module({
  imports: [EventsModule, ExpensesModule],
  controllers: [AiController],
  providers: [
    AiService,
    DeterministicAiProvider,
    {
      provide: AI_PROVIDER,
      useExisting: DeterministicAiProvider,
    },
  ],
  exports: [AiService],
})
export class AiModule {}