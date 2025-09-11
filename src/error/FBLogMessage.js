/**
 * Changelog:
 * - 09/09/2025
 */

import { err } from './err';
import { ErrorMetadata } from './ErrorMetadata';
import { ErrorNormalizeUtils } from './ErrorNormalizeUtils';
import { ErrorPubSub } from './ErrorPubSub';
import { ErrorSerializer } from './ErrorSerializer';
import { TAALOpcode } from './TAALOpcode';

export class FBLogMessage {
  constructor(projectName) {
    /** Project identifier attached to the log/error */
    this.project = projectName;

    /** Array of string event tags (e.g., feature flags, breadcrumbs) */
    this.events = [];

    /** Metadata collector for extra key/value/context triplets */
    this.metadata = new ErrorMetadata();

    /** TAAL opcodes indicating where to “blame” the error (file/frame/dir) */
    this.taalOpcodes = [];
  }

  /**
   * Core logging routine.
   * Builds/normalizes an error from either:
   *  - a previously “caught” normalized error (via `catchingNormalizedError`)
   *  - a previously “caught” raw Error (via `catching`)
   *  - or creates a fresh Error from message/params
   *
   * @param {'fatal'|'error'|'warn'|'info'} level     Log level / error type
   * @param {string} messageFormat                    Message format string
   * @param  {...any} params                          Message parameters
   * @returns {Error}                                 The underlying error object (raw)
   */
  logMessage(level, msgFormat, ...params) {
    const fmt = String(msgFormat);

    // Local aliases for properties we’ll add back onto the normalized error
    const { events, project, metadata, blameModule, forcedKey } = this;

    /** @type {Error|undefined} Raw error (if provided via .catching) */
    let rawError = this.error;

    /** @type {any} Normalized error object (output of ErrorNormalizeUtils.normalizeError) */
    let normalized;

    // Case 1: caller already provided a normalized error object
    if (this.normalizedError) {
      // Compose a combined message: prepend the existing normalized message, then append current
      const composed = {
        message: `${this.normalizedError.messageFormat} [Caught in: ${fmt}]`,
        params: [].concat(this.normalizedError.messageParams, params),
        forcedKey,
      };

      normalized = Object.assign(this.normalizedError, {
        message: composed.message,
        messageFormat: composed.message,
        messageParams: ErrorSerializer.toStringParams(composed.params),
        project,
        type: level,
        loggingSource: 'FBLOGGER',
      });
      // Case 2: caller provided a raw Error (via .catching)
    } else if (rawError !== null && rawError !== undefined) {
      if (this.taalOpcodes.length > 0) {
        new FBLogMessage('fblogger')
          .blameToPreviousFrame()
          .blameToPreviousFrame()
          .warn('Blame helpers do not work with catching');
      }

      // Enrich the existing error with FBLOGGER fields
      ErrorSerializer.aggregateError(rawError, {
        messageFormat: fmt,
        messageParams: ErrorSerializer.toStringParams(params),
        errorName: rawError.name,
        forcedKey,
        project,
        type: level,
        loggingSource: 'FBLOGGER',
      });

      normalized = ErrorNormalizeUtils.normalizeError(rawError);

      // Case 3: create a new Error from the message/params
    } else {
      const freshError = new Error(fmt);
      if (freshError.stack === undefined) {
        try {
          throw freshError;
        } catch {}
      }

      // Attach formatting and FBLOGGER-specific fields
      freshError.messageFormat = fmt;
      freshError.messageParams = ErrorSerializer.toStringParams(params);
      freshError.blameModule = blameModule;
      freshError.forcedKey = forcedKey;
      freshError.project = project;
      freshError.type = level;
      freshError.loggingSource = 'FBLOGGER';

      // Add TAAL blame hints: two PREVIOUS_FRAME plus any accumulated opcodes
      freshError.taalOpcodes = [TAALOpcode.PREVIOUS_FRAME, TAALOpcode.PREVIOUS_FRAME].concat(this.taalOpcodes);

      normalized = ErrorNormalizeUtils.normalizeError(freshError);
      normalized.name = 'FBLogger';

      // Expose the created raw error via local variable for return
      rawError = freshError;
    }

    // Attach formatted metadata (if any)
    if (!metadata.isEmpty()) {
      normalized.metadata = metadata.format();
    }

    // Merge event tags (if any)
    if (events.length > 0) {
      if (normalized?.events !== undefined) {
        // push into existing array to preserve reference
        const arr = normalized.events;
        arr.push.apply(arr, events);
      } else {
        normalized.events = events;
      }
    }

    // Publish the normalized error to subscribers (e.g., network logger)
    ErrorPubSub.reportNormalizedError(normalized);

    // Return the underlying raw error (if any)
    return rawError;
  }

  /** Shorthand: log a fatal error */
  fatal = (msg, ...params) => {
    this.logMessage('fatal', msg, ...params);
  };

  /** Shorthand: log a must-fix (treated as error) */
  mustfix = (msg, ...params) => {
    this.logMessage('error', msg, ...params);
  };

  /** Shorthand: log a warning */
  warn = (msg, ...params) => {
    this.logMessage('warn', msg, ...params);
  };

  /** Shorthand: log an info message */
  info = (msg, ...params) => {
    this.logMessage('info', msg, ...params);
  };

  debug(msg) {
    /** */
  }

  /**
   * Log as error and throw.
   * NOTE: The call `this.logMessage('error', msg, params)` passes `params` as a single array argument.
   * Likely intention was `...params`. Keeping as-is to preserve behavior.
   */
  mustfixThrow(msg, ...params) {
    let thrown = this.logMessage('error', msg, params);

    if (!thrown) {
      // If we couldn't create/capture a raw error, synthesize one and blame previous frame
      thrown = err('mustfixThrow does not support catchingNormalizedError');
      thrown.taalOpcodes = thrown.taalOpcodes || [];
      thrown.taalOpcodes.push(TAALOpcode.PREVIOUS_FRAME);
    }

    throw thrown;
  }

  /**
   * Provide a raw Error that will be normalized and enriched on log.
   * If a non-Error is given, logs a warning (blamed to previous frames) and ignores it.
   */
  catching(possibleError) {
    if (!(possibleError instanceof Error)) {
      new FBLogMessage('fblogger').blameToPreviousFrame().warn('Catching non-Error object is not supported');
    } else {
      this.error = possibleError;
    }
    return this;
  }

  /**
   * Provide a pre-normalized error object to be augmented and re-published.
   */
  catchingNormalizedError(normalErr) {
    this.normalizedError = normalErr;
    return this;
  }

  /** Append an event tag (breadcrumb/marker) */
  event(event) {
    this.events.push(event);
    return this;
  }

  /** Attribute/blame this log to a specific module name */
  blameToModule(msg) {
    this.blameModule = msg;
  }

  /** Add a TAAL blame marker: previous file */
  blameToPreviousFile() {
    this.taalOpcodes.push(TAALOpcode.PREVIOUS_FILE);
    return this;
  }

  /** Add a TAAL blame marker: previous stack frame */
  blameToPreviousFrame() {
    this.taalOpcodes.push(TAALOpcode.PREVIOUS_FRAME);
    return this;
  }

  /** Add a TAAL blame marker: previous directory */
  blameToPreviousDirectory() {
    this.taalOpcodes.push(TAALOpcode.PREVIOUS_DIR);
    return this;
  }

  /** Set/override a forced key to group/categorize the log */
  addToCategoryKey(forcedKey) {
    this.forcedKey = forcedKey;
    return this;
  }

  /** Add a single metadata entry (key, value, context) */
  addMetadata(key, value, context) {
    this.metadata.addEntry(key, value, context);
    return this;
  }
}
