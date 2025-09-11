import { env } from '@fb-utils/env';

import { ErrorGuard } from './ErrorGuard';
import { ErrorSetup } from './ErrorSetup';
import { JSErrorLoggingConfig } from './JSErrorLoggingConfig';
import { SiteData } from './SiteData';

ErrorSetup.preSetup();

export const CometErrorLogging = {
  init: (cavalry_lid) => {
    ErrorGuard.skipGuardGlobal(env.nocatch);

    if (JSErrorLoggingConfig.sampleWeight) {
      ErrorSetup.setup({
        appId: JSErrorLoggingConfig.appId,
        cavalry_lid,
        client_revision: SiteData.client_revision,
        extra: JSErrorLoggingConfig.extra,
        loggingFramework: 'comet',
        projectBlocklist: JSErrorLoggingConfig.projectBlocklist,
        push_phase: SiteData.push_phase,
        report_source: JSErrorLoggingConfig.report_source,
        report_source_ref: JSErrorLoggingConfig.report_source_ref,
        sample_weight: JSErrorLoggingConfig.sampleWeight !== null ? JSErrorLoggingConfig.sampleWeight : 0,
        script_path: '/comet',
        server_revision: SiteData.server_revision,
        spin: SiteData.spin,
        // web_session_id: WebSession.getId(),
      });
    }
  },
};
