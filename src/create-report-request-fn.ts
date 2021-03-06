import * as ls from './types';
import * as api from './models';
import { mapToKeyValueArray, toSpan } from './transform';
import { hexToDec } from './utils';
import { ReadableSpan } from '@opentelemetry/tracing';

/**
 * Creates and returns a createReportRequest function
 *
 * @param runtimeGUID
 * @param reporterTags
 * @param accessToken
 */
export function createReportRequestFn(
  runtimeGUID: string,
  reporterTags: { [key: string]: any },
  accessToken?: string
): (spans: ReadableSpan[]) => ls.ReportRequest {
  const auth: ls.Auth = new api.Auth({ accessToken });
  let reporter: ls.Reporter;

  /**
   * Cache the reporter using Resource label from the first span received.
   * This assumes that a the Resource is static for the lifetime of the process.
   * If this assumption turns out to not be true, we should recreate the
   * reporter for each ReportRequest.
   *
   * @param attributes
   */
  function setReporter(attributes: { [key: string]: any }): ls.Reporter {
    return (reporter = new api.Reporter({
      reporterId: hexToDec(runtimeGUID),
      tags: mapToKeyValueArray(attributes),
    }));
  }

  return function(spans: ReadableSpan[]): ls.ReportRequest {
    return new api.ReportRequest({
      auth,
      reporter:
        reporter ||
        setReporter({ ...reporterTags, ...spans[0].resource.labels }),
      spans: spans.map(toSpan),
      timestampOffsetMicros: '0',
    });
  };
}
