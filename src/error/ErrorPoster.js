/**
 * ErrorPoster
 *
 * Builds a normalized error payload and decides whether to post it,
 * based on sampling, filters, and project blocklists.
 *
 * Changelog:
 * - 09/12/2024
 */
import { ErrorDynamicData } from './ErrorDynamicData';
import { ErrorFilter } from './ErrorFilter';

/**
 * @typedef {Object} NormalizedError
 * @property {string} hash
 * @property {string} [project]
 * @property {string} [name]
 * @property {string} [type]
 * @property {string} [messageFormat]
 * @property {any[]}  [messageParams]
 * @property {number} [clientTime]
 * @property {number|string} [line]
 * @property {number|string} [column]
 * @property {string} [script]
 * @property {string} [script_path]
 * @property {string} [loggingSource]
 * @property {string[]} [guardList]
 * @property {string[]} [events]
 * @property {Record<string, any>} [extra]
 * @property {any[]} [stackFrames]
 * @property {any[]} [componentStackFrames]
 * @property {string} [blameModule]
 * @property {string[]} [metadata]
 * @property {string[]} [loadingUrls]
 * @property {string} [serverHash]
 * @property {string} [windowLocationURL]
 * @property {string[]} [xFBDebug]
 * @property {number[]} [taalOpcodes]
 * @property {string[]} [tags]
 * @property {{stackFrames?: any[]}} [deferredSource]
 * @property {string} [page_time]
 * @property {string} [forcedKey]
 */

/**
 * @typedef {Object} PostProps
 * @property {string} [appId]
 * @property {string} [cavalry_lid]
 * @property {string} [bundle_variant]
 * @property {string} [frontend_env]
 * @property {string} [loggingFramework]
 * @property {string[]} [extra]
 * @property {number} [sample_weight]
 * @property {string} [site_category]
 * @property {string} [push_phase]
 * @property {string} [script_path]
 * @property {string} [report_source]
 * @property {string} [report_source_ref]
 * @property {string} [rollout_hash]
 * @property {string} [server_revision]
 * @property {string} [spin]
 * @property {string|number} [client_revision]
 * @property {Iterable<string|number>} [additional_client_revisions]
 * @property {string} [web_session_id]
 * @property {string[]} [projectBlocklist]
 */

// max message length before truncation
let MAX_MESSAGE_LENGTH = 1024;
// monotonic post counter
let postSequence = 0;
// rolling ancestor hashes (max 15)
let ancestorHashes = [];

/**
 * Coerces any value to string.
 * @param {*} val
 * @returns {string}
 */
function toStringSafe(val) {
  return String(val);
}

/**
 * Coerces a non-nullish value to string, otherwise returns `undefined`.
 * @param {*} val
 * @returns {string|undefined}
 */
function toStringOrUndefined(val) {
  return !val ? undefined : String(val);
}

/**
 * Computes the “events” field by diffing normalized error extras against static props extras.
 * Any key present in either source is included; falsy in nError.extra removes it.
 *
 * @param {Record<string, any>} errorExtras  - extras from normalized error
 * @param {string[]} [propExtras ] - optional extras from props
 * @returns {string[]} consolidated event keys
 */
function diffEvents(errorExtras, propExtras) {
  const set = {};
  propExtras &&
    propExtras.forEach((key) => {
      set[key] = true;
    });
  Object.keys(errorExtras).forEach((key) => {
    errorExtras[key] ? (set[key] = true) : set[key] && delete set[key];
  });
  return Object.keys(set);
}

/**
 * Safely truncates long strings to U chars (adds ellipsis if truncated).
 * @param {string} text
 * @returns {string}
 */
function truncateMsg(text) {
  const str = String(text);
  return str.length > MAX_MESSAGE_LENGTH ? str.substring(0, MAX_MESSAGE_LENGTH - 3) + '...' : str;
}

/**
 * Normalizes an array of stack frame-like objects to a compact JSON shape.
 *
 * @param {{column?:number|string, identifier?:string, line?:number|string, script?:string}[]|null|undefined} frames
 * @returns {{column?:string, identifier?:string, line?:string, script?:string}[]}
 */
function normalizeStackFrames(frames) {
  return (frames !== null && frames !== undefined ? frames : []).map((frame) => ({
    column: toStringOrUndefined(frame.column),
    identifier: frame?.identifier,
    line: toStringOrUndefined(frame.line),
    script: frame?.script,
  }));
}

/**
 * Build the final payload without mutating the input error.
 * @param {NormalizedError} normalizedError
 * @param {PostProps} props
 */
function createErrorPayload(normalizedError, props) {
  const payload = {
    appId: toStringOrUndefined(props.appId),
    cavalry_lid: props.cavalry_lid,
    access_token: ErrorDynamicData.access_token,
    ancestor_hash: normalizedError.hash,
    bundle_variant: props.bundle_variant ?? null,
    clientTime: toStringSafe(normalizedError.clientTime),
    column: normalizedError.column,
    componentStackFrames: normalizeStackFrames(normalizedError.componentStackFrames),
    events: normalizedError.events,
    extra: diffEvents(normalizedError.extra, props.extra),
    forcedKey: normalizedError.forcedKey,
    frontend_env: props.frontend_env ?? undefined,
    guardList: normalizedError.guardList,
    line: normalizedError.line,
    loggingFramework: props.loggingFramework,
    messageFormat: truncateMsg(normalizedError.messageFormat),
    messageParams: normalizedError.messageParams.map(truncateMsg),
    name: normalizedError.name,
    sample_weight: toStringOrUndefined(props.sample_weight),
    script: normalizedError.script,
    site_category: props.site_category,
    stackFrames: normalizeStackFrames(normalizedError.stackFrames),
    type: normalizedError.type,
    page_time: toStringOrUndefined(normalizedError.page_time),
    project: normalizedError.project,
    push_phase: props.push_phase,
    script_path: props.script_path,
    taalOpcodes: !normalizedError.taalOpcodes ? undefined : normalizedError.taalOpcodes.map((x) => x),
    report_source: props.report_source,
    report_source_ref: props.report_source_ref,
    rollout_hash: props.rollout_hash ?? null,
    server_revision: toStringOrUndefined(props.server_revision),
    spin: toStringOrUndefined(props.spin),
    svn_rev: String(props.client_revision),
    additional_client_revisions: Array.from(props.additional_client_revisions ?? []).map(toStringSafe),
    web_session_id: props.web_session_id,
    version: '3',
    xFBDebug: normalizedError.xFBDebug,
    tags: normalizedError.tags,
  };

  // Optional fields set only when present on the normalized error
  const deferredSource = normalizedError.deferredSource;

  if (normalizedError.blameModule !== null) {
    payload.blameModule = String(normalizedError.blameModule);
  }

  if (deferredSource && deferredSource.stackFrames) {
    // mutate the deferredSource with normalized frames (as expected by downstream)
    normalizedError.deferredSource = {
      stackFrames: normalizeStackFrames(deferredSource.stackFrames),
    };
  }

  if (normalizedError.metadata) payload.metadata = normalizedError.metadata;
  if (normalizedError.loadingUrls) payload.loadingUrls = normalizedError.loadingUrls;
  if (normalizedError.serverHash) payload.serverHash = normalizedError.serverHash;
  if (normalizedError.windowLocationURL) payload.windowLocationURL = normalizedError.windowLocationURL;
  if (normalizedError.loggingSource) payload.loggingSource = normalizedError.loggingSource;

  return payload;
}

/**
 * Post a normalized error if sampling, filters, and blocklists allow it.
 * @param {NormalizedError} normalizedError
 * @param {PostProps} props
 * @param {(payload:object)=>void} sendPayload
 * @returns {boolean}
 */
function postError(normalizedError, props, sendPayload) {
  postSequence += 1;

  // Skip entirely if sampling weight is zero
  if (props.sample_weight === 0) {
    return false;
  }

  // Respect dynamic filter (e.g., rate limit, dedupe, allowlist)
  const shouldLog = ErrorFilter.shouldLog(normalizedError);
  if (!shouldLog) {
    return false;
  }

  // Respect project-level blocklist
  if (props.projectBlocklist !== null && props.projectBlocklist.includes(normalizedError.project)) {
    return false;
  }

  // Build base payload
  const payload = createErrorPayload(normalizedError, props);

  // Enrich with posting-time context
  Object.assign(payload, {
    ancestors: ancestorHashes.slice(),
    clientWeight: toStringSafe(shouldLog),
    page_position: toStringSafe(postSequence),
  });

  // Track ancestor chain (bounded to 15)
  if (ancestorHashes.length < 15) {
    ancestorHashes.push(normalizedError.hash);
  }

  // Dispatch to sink
  sendPayload(payload);
  return true;
}

export const ErrorPoster = {
  createErrorPayload,
  postError,
};

// /**
//  * Changelog:
//  * - 09/12/2024
//  */

// import { ErrorDynamicData } from './ErrorDynamicData';
// import { ErrorFilter } from './ErrorFilter';

// let U = 1024;
// let position = 0;
// let ancestors = [];

// function toString(val) {
//   return String(val);
// }

// function toStringNotNull(val) {
//   return !val ? undefined : String(val);
// }

// function eventsDiff(nErrorExtra, propsExtra) {
//   const c = {};
//   propsExtra &&
//     propsExtra.forEach((a) => {
//       c[a] = true;
//     });
//   Object.keys(nErrorExtra).forEach((b) => {
//     nErrorExtra[b] ? (c[b] = true) : c[b] && delete c[b];
//   });
//   return Object.keys(c);
// }

// function splitMsgFormat(a) {
//   a = String(a);
//   return a.length > U ? a.substring(0, U - 3) + '...' : a;
// }

// function createStackItem(a) {
//   return (a !== null && a !== void 0 ? a : []).map((a) => {
//     return {
//       column: toStringNotNull(a.column),
//       identifier: a.identifier,
//       line: toStringNotNull(a.line),
//       script: a.script,
//     };
//   });
// }

// function createErrorPayload(nError, props) {
//   const obj = {
//     appId: toStringNotNull(props.appId), //
//     cavalry_lid: props.cavalry_lid,
//     access_token: ErrorDynamicData.access_token, //
//     ancestor_hash: nError.hash, //
//     bundle_variant: props.bundle_variant !== null && props.bundle_variant !== undefined ? props.bundle_variant : null,
//     clientTime: toString(nError.clientTime), //
//     column: nError.column, //
//     componentStackFrames: createStackItem(nError.componentStackFrames), //
//     events: nError.events, //
//     extra: eventsDiff(nError.extra, props.extra), //
//     forcedKey: nError.forcedKey, //
//     frontend_env: props.frontend_env !== null && props.frontend_env !== undefined ? props.frontend_env : undefined, //
//     guardList: nError.guardList, //
//     line: nError.line, //
//     loggingFramework: props.loggingFramework, //
//     messageFormat: splitMsgFormat(nError.messageFormat), //
//     messageParams: nError.messageParams.map(splitMsgFormat), //
//     name: nError.name, //
//     sample_weight: toStringNotNull(props.sample_weight),
//     script: nError.script, //
//     site_category: props.site_category, //
//     stackFrames: createStackItem(nError.stackFrames), //
//     type: nError.type, //
//     page_time: toStringNotNull(nError.page_time),
//     project: nError.project, //
//     push_phase: props.push_phase,
//     script_path: props.script_path, //
//     taalOpcodes: !nError.taalOpcodes
//       ? undefined
//       : nError.taalOpcodes.map((a) => {
//           return a;
//         }),
//     report_source: props.report_source,
//     report_source_ref: props.report_source_ref,
//     rollout_hash: props.rollout_hash !== null && props.rollout_hash !== undefined ? props.rollout_hash : null,
//     server_revision: toStringNotNull(props.server_revision),
//     spin: toStringNotNull(props.spin),
//     svn_rev: String(props.client_revision),
//     additional_client_revisions: Array.from(
//       props.additional_client_revisions !== null && props.additional_client_revisions !== void 0
//         ? props.additional_client_revisions
//         : [],
//     ).map(toString),
//     web_session_id: props.web_session_id,
//     version: '3',
//     xFBDebug: nError.xFBDebug,
//   };

//   const d = nError.deferredSource;
//   nError.blameModule !== null && (obj.blameModule = String(nError.blameModule));
//   nError.deferredSource &&
//     nError.deferredSource.stackFrames &&
//     (nError.deferredSource.deferredSource = {
//       stackFrames: createStackItem(d.stackFrames),
//     });
//   nError.metadata && (obj.metadata = nError.metadata);
//   nError.loadingUrls && (obj.loadingUrls = nError.loadingUrls);
//   nError.serverHash && (obj.serverHash = nError.serverHash);
//   nError.windowLocationURL && (obj.windowLocationURL = nError.windowLocationURL);
//   nError.loggingSource && (obj.loggingSource = nError.loggingSource);
//   return obj;
// }

// // Post here
// function postError(nError, props, logFunc) {
//   position++;

//   if (props.sample_weight === 0) {
//     return false;
//   }

//   const shouldLog = ErrorFilter.shouldLog(nError);
//   if (!shouldLog) {
//     return false;
//   }

//   if (
//     props.projectBlocklist !== null &&
//     props.projectBlocklist !== undefined &&
//     props.projectBlocklist.includes(nError.project)
//   ) {
//     return false;
//   }

//   const payload = createErrorPayload(nError, props);

//   Object.assign(payload, {
//     ancestors: ancestors.slice(),
//     clientWeight: toString(shouldLog),
//     page_position: toString(position),
//   });

//   ancestors.length < 15 && ancestors.push(nError.hash);

//   logFunc(payload);
//   return true;
// }

// export const ErrorPoster = {
//   createErrorPayload,
//   postError,
// };
