import { IsObject } from 'class-validator';

export class CreatePreferenceReqDto {
  @IsObject()
  data: Record<string, unknown>;
}
