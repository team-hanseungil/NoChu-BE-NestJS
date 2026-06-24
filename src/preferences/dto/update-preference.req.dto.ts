import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BpmRangeDto, EmotionDirectionDto } from './create-preference.req.dto';

export class UpdatePreferenceReqDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genre?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmotionDirectionDto)
  emotionDirection?: EmotionDirectionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  artist?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  language?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BpmRangeDto)
  bpm?: BpmRangeDto;
}
