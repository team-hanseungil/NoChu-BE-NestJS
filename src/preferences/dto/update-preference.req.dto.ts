import { IsObject } from 'class-validator';

export class UpdatePreferenceReqDto {
  @IsObject()
  data: Record<string, unknown>;
}
