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

/** Max length for message strings before truncation. */
let U = 1024;
/** Monotonic position counter for error occurrences on the page. */
let position = 0;
/** Rolling list of ancestor error hashes to provide causal context. */
let ancestors = [];

/**
 * Coerces any value to string.
 * @param {*} val
 * @returns {string}
 */
function toString(val) {
  return String(val);
}

/**
 * Coerces a non-nullish value to string, otherwise returns `undefined`.
 * @param {*} val
 * @returns {string|undefined}
 */
function toStringNotNull(val) {
  return !val ? undefined : String(val);
}

/**
 * Computes the “events” field by diffing normalized error extras against static props extras.
 * Any key present in either source is included; falsy in nError.extra removes it.
 *
 * @param {Record<string, any>} nErrorExtra - extras from normalized error
 * @param {string[]} [propsExtra] - optional extras from props
 * @returns {string[]} consolidated event keys
 */
function eventsDiff(nErrorExtra, propsExtra) {
  const c = {};
  propsExtra &&
    propsExtra.forEach((a) => {
      c[a] = true;
    });
  Object.keys(nErrorExtra).forEach((b) => {
    nErrorExtra[b] ? (c[b] = true) : c[b] && delete c[b];
  });
  return Object.keys(c);
}

/**
 * Safely truncates long strings to U chars (adds ellipsis if truncated).
 * @param {string} a
 * @returns {string}
 */
function splitMsgFormat(a) {
  a = String(a);
  return a.length > U ? a.substring(0, U - 3) + '...' : a;
}

/**
 * Normalizes an array of stack frame-like objects to a compact JSON shape.
 *
 * @param {{column?:number|string, identifier?:string, line?:number|string, script?:string}[]|null|undefined} a
 * @returns {{column?:string, identifier?:string, line?:string, script?:string}[]}
 */
function createStackItem(a) {
  return (a !== null && a !== void 0 ? a : []).map((f) => ({
    column: toStringNotNull(f.column),
    identifier: f.identifier,
    line: toStringNotNull(f.line),
    script: f.script,
  }));
}

/**
 * Builds the final error payload object to be sent to the logging backend.
 *
 * NOTE: This function preserves field names expected by downstream systems.
 *
 * @param {Object} nError - normalized error object
 * @param {Object} props - static runtime props/config for logging
 * @returns {Object} payload - ready to be posted
 */
function createErrorPayload(nError, props) {
  const obj = {
    appId: toStringNotNull(props.appId),
    cavalry_lid: props.cavalry_lid,
    access_token: ErrorDynamicData.access_token,
    ancestor_hash: nError.hash,
    bundle_variant: props.bundle_variant ?? null,
    clientTime: toString(nError.clientTime),
    column: nError.column,
    componentStackFrames: createStackItem(nError.componentStackFrames),
    events: nError.events,
    extra: eventsDiff(nError.extra, props.extra),
    forcedKey: nError.forcedKey,
    frontend_env: props.frontend_env ?? undefined,
    guardList: nError.guardList,
    line: nError.line,
    loggingFramework: props.loggingFramework,
    messageFormat: splitMsgFormat(nError.messageFormat),
    messageParams: nError.messageParams.map(splitMsgFormat),
    name: nError.name,
    sample_weight: toStringNotNull(props.sample_weight),
    script: nError.script,
    site_category: props.site_category,
    stackFrames: createStackItem(nError.stackFrames),
    type: nError.type,
    page_time: toStringNotNull(nError.page_time),
    project: nError.project,
    push_phase: props.push_phase,
    script_path: props.script_path,
    taalOpcodes: !nError.taalOpcodes ? undefined : nError.taalOpcodes.map((x) => x),
    report_source: props.report_source,
    report_source_ref: props.report_source_ref,
    rollout_hash: props.rollout_hash ?? null,
    server_revision: toStringNotNull(props.server_revision),
    spin: toStringNotNull(props.spin),
    svn_rev: String(props.client_revision),
    additional_client_revisions: Array.from(props.additional_client_revisions ?? []).map(toString),
    web_session_id: props.web_session_id,
    version: '3',
    xFBDebug: nError.xFBDebug,
    tags: nError.tags,
  };

  // Optional fields set only when present on the normalized error
  const d = nError.deferredSource;

  if (nError.blameModule !== null) {
    obj.blameModule = String(nError.blameModule);
  }

  if (nError.deferredSource && nError.deferredSource.stackFrames) {
    // mutate the deferredSource with normalized frames (as expected by downstream)
    nError.deferredSource.deferredSource = {
      stackFrames: createStackItem(d.stackFrames),
    };
  }

  if (nError.metadata) obj.metadata = nError.metadata;
  if (nError.loadingUrls) obj.loadingUrls = nError.loadingUrls;
  if (nError.serverHash) obj.serverHash = nError.serverHash;
  if (nError.windowLocationURL) obj.windowLocationURL = nError.windowLocationURL;
  if (nError.loggingSource) obj.loggingSource = nError.loggingSource;

  return obj;
}

/**
 * Posts a normalized error if it passes sampling and blocklist checks.
 *
 * Side effects:
 *   - Increments a page-level `position` counter and includes it in payload.
 *   - Appends current error hash to the rolling `ancestors` (max 15).
 *
 * @param {Object} nError - normalized error (must include `hash`, `project`, etc.)
 * @param {Object} props  - posting configuration and static fields
 * @param {(payload:Object)=>void} logFunc - sink function that actually delivers the payload
 * @returns {boolean} true if posted (or attempted), false if skipped
 */
function postError(nError, props, logFunc) {
  position++;

  // Skip entirely if sampling weight is zero
  if (props.sample_weight === 0) {
    return false;
  }

  // Respect dynamic filter (e.g., rate limit, dedupe, allowlist)
  const shouldLog = ErrorFilter.shouldLog(nError);
  if (!shouldLog) {
    return false;
  }

  // Respect project-level blocklist
  if (props.projectBlocklist !== null && props.projectBlocklist.includes(nError.project)) {
    return false;
  }

  // Build base payload
  const payload = createErrorPayload(nError, props);

  // Enrich with posting-time context
  Object.assign(payload, {
    ancestors: ancestors.slice(),
    clientWeight: toString(shouldLog),
    page_position: toString(position),
  });

  // Track ancestor chain (bounded to 15)
  if (ancestors.length < 15) {
    ancestors.push(nError.hash);
  }

  // Dispatch to sink
  logFunc(payload);
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
