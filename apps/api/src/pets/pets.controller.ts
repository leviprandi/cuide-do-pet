import { Controller, Post, Get, Body } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';

@Controller('pets')
export class PetsController {
  constructor(private petsService: PetsService) {}

  @Post()
  async create(@Body() createPetDto: CreatePetDto) {
    return this.petsService.create(createPetDto);
  }

  @Get()
  async findAll() {
    return this.petsService.findAll();
  }
}
