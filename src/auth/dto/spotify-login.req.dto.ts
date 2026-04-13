import { IsString } from 'class-validator';

export class SpotifyLoginReqDto {
  @IsString()
  code: string;
}
