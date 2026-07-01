import {
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { EmotionsService } from './emotions.service';
import { AnalyzeEmotionResDto } from './dto/analyze-emotion.res.dto';
import { EmotionHistoryResDto } from './dto/emotion-history.res.dto';

@ApiTags('emotions')
@ApiBearerAuth()
@Controller('emotions')
@UseGuards(JwtAuthGuard)
export class EmotionsController {
  constructor(private readonly emotionsService: EmotionsService) {}

  @Post()
  @ApiOperation({ summary: '이미지 업로드 후 감정 분석' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async analyze(
    @Req() req: Request,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<AnalyzeEmotionResDto> {
    const { sub } = req.user as JwtPayload;
    const emotion = await this.emotionsService.analyze(sub, image);
    return AnalyzeEmotionResDto.from(emotion);
  }

  @Get()
  @ApiOperation({ summary: '내 감정 분석 이력 조회' })
  history(@Req() req: Request): Promise<EmotionHistoryResDto> {
    const { sub } = req.user as JwtPayload;
    return this.emotionsService.findHistory(sub);
  }
}
