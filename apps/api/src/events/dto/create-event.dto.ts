import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateEventDto {
  @IsUUID()
  petId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  occurredAt: string;
}