import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto, ResolveVisitorDto } from './dto/visitors.dto';
import { GuardJwtAuthGuard } from '../guard-auth/guards/guard-jwt.guard';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ActiveStatusGuard } from '../auth/guards/active-status.guard';
import { GuardJwtPayload } from '../guard-auth/strategies/guard-jwt.strategy';

// Shape returned by JwtStrategy.validate() — full user row from DB
interface ResidentUser {
  id: string;
  unitId: string | null;
  status: string;
}

@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  // Guard creates a visitor at the gate
  @Post()
  @UseGuards(GuardJwtAuthGuard)
  createGateVisitor(
    @Body() dto: CreateVisitorDto,
    @Request() req: { user: GuardJwtPayload },
  ) {
    return this.visitorsService.createGateVisitor(dto, req.user);
  }

  // Resident approves or denies a visitor
  @Patch(':id')
  @UseGuards(JwtAuthGuard, ActiveStatusGuard)
  resolveVisitor(
    @Param('id') id: string,
    @Body() dto: ResolveVisitorDto,
    @Request() req: { user: ResidentUser },
  ) {
    return this.visitorsService.resolveVisitor(id, dto, req.user.id);
  }

  // Resident fetches their visitor history
  @Get('history')
  @UseGuards(JwtAuthGuard, ActiveStatusGuard)
  getHistory(
    @Request() req: { user: ResidentUser },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const unitId = req.user.unitId;
    if (!unitId) return { visitors: [], total: 0 };
    return this.visitorsService.getVisitorHistory(
      unitId,
      parseInt(page),
      parseInt(limit),
    );
  }
}
