import { Module } from '@nestjs/common';
import { CommitteeController } from './committee.controller';
import { CommitteeService } from './committee.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommitteeController],
  providers: [CommitteeService],
})
export class CommitteeModule {}
