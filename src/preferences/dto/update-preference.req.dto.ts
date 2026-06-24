import { IsObject, IsOptional } from 'class-validator';

export class UpdatePreferenceReqDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
