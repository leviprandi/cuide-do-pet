import { IsNotEmpty, IsString } from 'class-validator';

export class InterpretMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}