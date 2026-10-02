/**
 * EDI badges and review notes. The label, level and meaning are EDI's own
 * (computed server-side with EDI's functions); this file only draws them.
 * Colour never carries the meaning alone: the label and a text description
 * are always present.
 */
import type {Locale} from '../config.ts';
import {fmt, formatDate} from '../i18n/format.ts';
import type {Messages} from '../i18n/en.ts';
import {completeness, type GradeView, type ReviewView} from '../model/view-types.ts';

type GradeMessages = Pick<Messages, 'grade'>;

export function gradeClass(grade: GradeView): string {
  return grade.level === null ? 'gq' : `g${grade.level}`;
}

/** "Complete", "Partial" or "Unknown", in the page language. */
export function completenessLabel(grade: GradeView, m: GradeMessages): string {
  const value = completeness(grade);
  return value === 'complete' ? m.grade.complete : value === 'partial' ? m.grade.partial : m.grade.unknown;
}

export function completenessLong(grade: GradeView, m: GradeMessages): string {
  const value = completeness(grade);
  return value === 'complete' ? m.grade.completeLong : value === 'partial' ? m.grade.partialLong : m.grade.unknownLong;
}

export function GradeBadge({
  grade,
  m,
  scope,
  size,
}: {
  grade: GradeView;
  m: GradeMessages;
  /** Visually hidden prefix naming what is graded, e.g. "Mechanism". */
  scope?: string;
  size?: 'sm' | 'lg';
}) {
  const state = completeness(grade);
  const classes = ['grade', gradeClass(grade), state !== 'complete' ? `grade-${state}` : '', size ? `grade-${size}` : ''].filter(Boolean).join(' ');
  return (
    <span className={classes} data-grade={grade.label}>
      <span className="sr-only">{scope ? `${scope}: ` : ''}</span>
      {grade.label}
      <span className="sr-only">{` (${completenessLabel(grade, m)})`}</span>
    </span>
  );
}

export function reviewText(review: ReviewView, locale: Locale, m: GradeMessages, scope: 'mechanism' | 'position' = 'mechanism', short = false): string | null {
  if (review.permanent) return short ? m.grade.permanentShort : m.grade.permanent;
  if (!review.dueAt) return null;
  const date = formatDate(review.dueAt, locale);
  if (scope === 'position') return fmt(review.overdue ? m.grade.positionOverdue : m.grade.positionDue, {date});
  return fmt(review.overdue ? m.grade.overdue : m.grade.due, {date});
}

export function ReviewNote({review, locale, m, scope, short}: {review: ReviewView; locale: Locale; m: GradeMessages; scope?: 'mechanism' | 'position'; short?: boolean}) {
  const text = reviewText(review, locale, m, scope, short);
  if (!text) return null;
  return <span className={`review-note${review.overdue ? ' is-overdue' : ''}`}>{text}</span>;
}
