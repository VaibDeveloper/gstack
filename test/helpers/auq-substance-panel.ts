/**
 * auq-matrix recommendation substance (C4, approved 2026-10-04): one native
 * capture per skill, scored by a JUDGE_PANEL_SAMPLES panel of the same grader
 * on that capture. The panel mean gates against the unchanged minimum; a sample
 * error fails the panel and is never resampled (judgePanel).
 */
import { gradeAuqRecommendation } from './auq-sdk-capture';
import { judgePanel, judgePanelMean } from './llm-judge';

export const AUQ_SUBSTANCE_MIN = 4;

type Grade = Awaited<ReturnType<typeof gradeAuqRecommendation>>;

export async function auqSubstancePanel(text: string, grade: (text: string) => Promise<Grade> = gradeAuqRecommendation) {
  const samples = await judgePanel(() => grade(text));
  const mean = judgePanelMean(samples, ['substance']).substance;
  return { samples, mean, passed: mean >= AUQ_SUBSTANCE_MIN };
}
