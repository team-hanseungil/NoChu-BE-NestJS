import { Emotion } from '../emotion.entity';

export interface EmotionHistoryItem {
  id: string;
  date: string;
  emotion: string;
  confidence: number;
}

const DAY_MS = 86_400_000;

export class EmotionHistoryResDto {
  totalRecords: number;
  averageConfidence: number;
  streak: number;
  emotions: EmotionHistoryItem[];

  static from(records: Emotion[]): EmotionHistoryResDto {
    const dto = new EmotionHistoryResDto();
    dto.totalRecords = records.length;
    dto.averageConfidence = records.length
      ? Math.round(
          records.reduce((sum, r) => sum + r.confidence, 0) / records.length,
        )
      : 0;
    dto.streak = EmotionHistoryResDto.calcStreak(records);
    dto.emotions = records.map((r) => ({
      id: r.id,
      date: EmotionHistoryResDto.toDate(r.createdAt),
      emotion: r.emotion,
      confidence: r.confidence,
    }));
    return dto;
  }

  private static toDate(value: Date): string {
    return new Date(value).toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Seoul',
    });
  }

  private static calcStreak(records: Emotion[]): number {
    const dates = [
      ...new Set(records.map((r) => EmotionHistoryResDto.toDate(r.createdAt))),
    ].sort((a, b) => (a < b ? 1 : -1));

    if (dates.length === 0) {
      return 0;
    }

    const todayStr = EmotionHistoryResDto.toDate(new Date());
    const diffToToday = (Date.parse(todayStr) - Date.parse(dates[0])) / DAY_MS;
    if (diffToToday > 1) {
      return 0;
    }

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (Date.parse(dates[i - 1]) - Date.parse(dates[i])) / DAY_MS;
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}
