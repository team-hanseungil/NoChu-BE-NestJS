import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PreferencesService } from './preferences.service';
import { CreatePreferenceReqDto } from './dto/create-preference.req.dto';
import { UpdatePreferenceReqDto } from './dto/update-preference.req.dto';
import { PreferenceResDto } from './dto/preference.res.dto';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async upsert(
    @Req() req: Request,
    @Body() dto: CreatePreferenceReqDto,
  ): Promise<PreferenceResDto> {
    const { sub } = req.user as JwtPayload;
    const preference = await this.preferencesService.upsert(sub, dto.data);
    return PreferenceResDto.from(preference);
  }

  @Get()
  async find(@Req() req: Request): Promise<PreferenceResDto> {
    const { sub } = req.user as JwtPayload;
    const preference = await this.preferencesService.getByUserId(sub);
    return PreferenceResDto.from(preference);
  }

  @Patch()
  async update(
    @Req() req: Request,
    @Body() dto: UpdatePreferenceReqDto,
  ): Promise<PreferenceResDto> {
    const { sub } = req.user as JwtPayload;
    const preference = await this.preferencesService.patch(sub, dto.data);
    return PreferenceResDto.from(preference);
  }
}
