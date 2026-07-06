import { IsOptional, IsString } from 'class-validator';

export class MusicRecommendationReqDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
