import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFabricDto } from './dto/create-fabric.dto';
import { UpdateFabricDto } from './dto/update-fabric.dto';
import { Fabric } from './entities/fabric.entity';

@Injectable()
export class FabricsService {
  constructor(
    @InjectRepository(Fabric)
    private fabricsRepository: Repository<Fabric>,
  ) {}

  async create(createFabricDto: CreateFabricDto): Promise<Fabric> {
    // Check if fabric name already exists
    const existingFabric = await this.fabricsRepository.findOne({
      where: { name: createFabricDto.name },
    });

    if (existingFabric) {
      throw new ConflictException(`Fabric with name ${createFabricDto.name} already exists`);
    }

    const fabric = this.fabricsRepository.create(createFabricDto);
    return await this.fabricsRepository.save(fabric);
  }

  async findAll(isActive?: boolean): Promise<Fabric[]> {
    const query = this.fabricsRepository.createQueryBuilder('fabric');

    if (isActive !== undefined) {
      query.andWhere('fabric.isActive = :isActive', { isActive });
    }

    return await query.orderBy('fabric.name', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Fabric> {
    const fabric = await this.fabricsRepository.findOne({
      where: { id },
    });

    if (!fabric) {
      throw new NotFoundException(`Fabric with ID ${id} not found`);
    }

    return fabric;
  }

  async update(id: number, updateFabricDto: UpdateFabricDto): Promise<Fabric> {
    const fabric = await this.findOne(id);

    // Check if updating name and if it conflicts with another fabric
    if (updateFabricDto.name && updateFabricDto.name !== fabric.name) {
      const existingFabric = await this.fabricsRepository.findOne({
        where: { name: updateFabricDto.name },
      });

      if (existingFabric) {
        throw new ConflictException(`Fabric with name ${updateFabricDto.name} already exists`);
      }
    }

    Object.assign(fabric, updateFabricDto);
    return await this.fabricsRepository.save(fabric);
  }

  async remove(id: number): Promise<void> {
    const fabric = await this.findOne(id);
    await this.fabricsRepository.softDelete(id);
  }
}
