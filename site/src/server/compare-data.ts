/**
 * The compare page's data file: what it needs besides the directory index.
 * Each record's limits and every figure about a record, with the fields the
 * comparison rules read and its line already formatted in the page language.
 */
import type {Locale} from '../config.ts';
import {messages} from '../i18n/index.ts';
import type {CompareData, CompareObservation} from '../model/compare.ts';
import {observationView} from '../model/views.ts';
import {catalog} from './site.ts';

export function compareData(locale: Locale): CompareData {
  const m = messages(locale);
  const records = new Set(catalog.objects.map(object => object.id));
  const limits: Record<string, string[]> = {};
  for (const object of catalog.objects) {
    const reason = object.entity.positionReview?.reason;
    const items = [...(object.entity.limits ?? []), ...(reason ? [reason] : [])];
    if (items.length) limits[object.id] = items;
  }
  const observations: CompareObservation[] = [...catalog.observations.values()]
    .filter(observation => records.has(observation.subjectId))
    .map(observation => {
      const {metric, value, exact, when, multichain} = observationView(observation, locale, m);
      return {
        id: observation.id,
        subjectId: observation.subjectId,
        metric: observation.metric,
        unit: observation.unit,
        measure: observation.measure,
        chainIds: observation.chainIds,
        ...(observation.ratePeriod ? {ratePeriod: observation.ratePeriod} : {}),
        ...(observation.interval ? {interval: observation.interval} : {}),
        ...(observation.asOf ? {asOf: observation.asOf} : {}),
        ...(observation.comparisonGroup ? {comparisonGroup: observation.comparisonGroup} : {}),
        view: {metric, value, exact, when, multichain},
      };
    });
  return {version: 1, edition: catalog.edition.id, locale, limits, observations};
}
