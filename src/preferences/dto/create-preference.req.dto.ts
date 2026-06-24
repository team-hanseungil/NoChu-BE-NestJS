import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

export class EmotionDirectionDto {
  @IsString()
  emotion: string;

  @IsString()
  direction: string;
}

export class BpmRangeDto {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;
}

export class CreatePreferenceReqDto {
  @IsArray()
  @IsString({ each: true })
  genre: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmotionDirectionDto)
  emotionDirection: EmotionDirectionDto[];

  @IsArray()
  @IsString({ each: true })
  artist: string[];

  @IsArray()
  @IsString({ each: true })
  language: string[];

  @ValidateNested()
  @Type(() => BpmRangeDto)
  bpm: BpmRangeDto;
}
