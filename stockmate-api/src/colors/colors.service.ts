import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { Color } from './entities/color.entity';

@Injectable()
export class ColorsService {
  constructor(
    @InjectRepository(Color)
    private colorsRepository: Repository<Color>,
  ) {}

  async create(createColorDto: CreateColorDto): Promise<Color> {
    // Check if color name already exists
    const existingColor = await this.colorsRepository.findOne({
      where: { name: createColorDto.name },
    });

    if (existingColor) {
      throw new ConflictException(`Color with name ${createColorDto.name} already exists`);
    }

    const color = this.colorsRepository.create(createColorDto);
    return await this.colorsRepository.save(color);
  }

  async findAll(isActive?: boolean): Promise<Color[]> {
    const query = this.colorsRepository.createQueryBuilder('color');

    if (isActive !== undefined) {
      query.andWhere('color.isActive = :isActive', { isActive });
    }

    return await query.orderBy('color.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Color> {
    const color = await this.colorsRepository.findOne({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    return color;
  }

  async update(id: string, updateColorDto: UpdateColorDto): Promise<Color> {
    const color = await this.findOne(id);

    // Check if updating name and if it conflicts with another color
    if (updateColorDto.name && updateColorDto.name !== color.name) {
      const existingColor = await this.colorsRepository.findOne({
        where: { name: updateColorDto.name },
      });

      if (existingColor) {
        throw new ConflictException(`Color with name ${updateColorDto.name} already exists`);
      }
    }

    Object.assign(color, updateColorDto);
    return await this.colorsRepository.save(color);
  }

  async remove(id: string): Promise<void> {
    const color = await this.findOne(id);
    await this.colorsRepository.softDelete(id);
  }
}
