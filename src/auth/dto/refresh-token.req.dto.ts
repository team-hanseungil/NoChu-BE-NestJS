import { IsString } from 'class-validator';

export class RefreshTokenReqDto {
  @IsString()
  refreshToken: string;
}
