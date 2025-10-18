import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FabricsService } from './fabrics.service';
import { FabricsController } from './fabrics.controller';
import { Fabric } from './entities/fabric.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fabric])],
  controllers: [FabricsController],
  providers: [FabricsService],
  exports: [FabricsService],
})
export class FabricsModule {}
