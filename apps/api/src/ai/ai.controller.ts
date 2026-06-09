import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { InterpretMessageDto } from './dto/interpret-message.dto';
import type { AiInterpretationResult } from './types/ai-interpretation-result.interface';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('interpret')
  async interpret(@Body() dto: InterpretMessageDto): Promise<AiInterpretationResult> {
    return this.aiService.interpret(dto.message);
  }

  @Post('handle')
  async handle(@Body() dto: InterpretMessageDto): Promise<AiInterpretationResult> {
    return this.aiService.handle(dto.message);
  }
}