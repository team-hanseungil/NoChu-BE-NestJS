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
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);

    const year = parts.find((p) => p.type === 'year')!.value;
    const month = parts.find((p) => p.type === 'month')!.value;
    const day = parts.find((p) => p.type === 'day')!.value;

    return `${year}-${month}-${day}`;
  }

  private static toMs(dateStr: string): number {
    const [year, month, day] = dateStr.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  }

  private static calcStreak(records: Emotion[]): number {
    const dates = [
      ...new Set(records.map((r) => EmotionHistoryResDto.toDate(r.createdAt))),
    ].sort((a, b) => (a < b ? 1 : -1));

    if (dates.length === 0) {
      return 0;
    }

    const todayMs = EmotionHistoryResDto.toMs(
      EmotionHistoryResDto.toDate(new Date()),
    );
    if ((todayMs - EmotionHistoryResDto.toMs(dates[0])) / DAY_MS > 1) {
      return 0;
    }

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff =
        (EmotionHistoryResDto.toMs(dates[i - 1]) -
          EmotionHistoryResDto.toMs(dates[i])) /
        DAY_MS;
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}
