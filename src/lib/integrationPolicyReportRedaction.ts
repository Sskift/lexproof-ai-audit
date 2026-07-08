import { redactClassifiedText } from "./dataClassification.js";

type IntegrationPolicyControl = {
  id: string;
  label: string;
  evidence: string;
  recoveryAction: string;
};

type IntegrationPolicyAdapter = {
  provider: string;
  label: string;
  mode: string;
  credentialPolicy: string;
  readinessEvidence: string;
  requiredControls: string[];
  disabledReason?: string;
};

type IntegrationPolicyReportShape = {
  controls?: IntegrationPolicyControl[];
  adapters?: IntegrationPolicyAdapter[];
  nextActions?: string[];
};

const legalConclusionPattern =
  /\b(final legal decision|legal opinion|legal conclusion|legally compliant|legally non-compliant|compliance decision|legal approval)\b/gi;

export function redactIntegrationPolicyReport<T extends IntegrationPolicyReportShape>(report: T): T {
  let changed = false;
  const controls = mapPossiblyChanged(report.controls, redactIntegrationPolicyControl);
  const adapters = mapPossiblyChanged(report.adapters, redactIntegrationPolicyAdapter);
  const nextActions = mapStringsPossiblyChanged(report.nextActions);

  changed = controls.changed || adapters.changed || nextActions.changed;
  if (!changed) {
    return report;
  }

  return {
    ...report,
    ...(controls.value ? { controls: controls.value } : {}),
    ...(adapters.value ? { adapters: adapters.value } : {}),
    ...(nextActions.value ? { nextActions: nextActions.value } : {})
  };
}

function redactIntegrationPolicyControl<T extends IntegrationPolicyControl>(control: T): { value: T; changed: boolean } {
  const id = redactIntegrationPolicyText(control.id);
  const label = redactIntegrationPolicyText(control.label);
  const evidence = redactIntegrationPolicyText(control.evidence);
  const recoveryAction = redactIntegrationPolicyText(control.recoveryAction);
  const changed =
    id !== control.id ||
    label !== control.label ||
    evidence !== control.evidence ||
    recoveryAction !== control.recoveryAction;

  if (!changed) {
    return { value: control, changed: false };
  }

  return {
    value: {
      ...control,
      id,
      label,
      evidence,
      recoveryAction
    } as T,
    changed: true
  };
}

function redactIntegrationPolicyAdapter<T extends IntegrationPolicyAdapter>(adapter: T): { value: T; changed: boolean } {
  const provider = redactIntegrationPolicyText(adapter.provider);
  const label = redactIntegrationPolicyText(adapter.label);
  const mode = redactIntegrationPolicyText(adapter.mode);
  const credentialPolicy = redactIntegrationPolicyText(adapter.credentialPolicy);
  const readinessEvidence = redactIntegrationPolicyText(adapter.readinessEvidence);
  const requiredControls = mapStringsPossiblyChanged(adapter.requiredControls);
  const disabledReason =
    adapter.disabledReason === undefined ? undefined : redactIntegrationPolicyText(adapter.disabledReason);
  const changed =
    provider !== adapter.provider ||
    label !== adapter.label ||
    mode !== adapter.mode ||
    credentialPolicy !== adapter.credentialPolicy ||
    readinessEvidence !== adapter.readinessEvidence ||
    requiredControls.changed ||
    disabledReason !== adapter.disabledReason;

  if (!changed) {
    return { value: adapter, changed: false };
  }

  return {
    value: {
      ...adapter,
      provider,
      label,
      mode,
      credentialPolicy,
      readinessEvidence,
      requiredControls: requiredControls.value ?? adapter.requiredControls,
      ...(disabledReason === undefined ? {} : { disabledReason })
    } as T,
    changed: true
  };
}

function mapPossiblyChanged<T>(
  values: T[] | undefined,
  mapper: (value: T) => { value: T; changed: boolean }
): { value?: T[]; changed: boolean } {
  if (!values) {
    return { changed: false };
  }

  let changed = false;
  const mapped = values.map((value) => {
    const result = mapper(value);
    changed = changed || result.changed;
    return result.value;
  });

  return changed ? { value: mapped, changed: true } : { value: values, changed: false };
}

function mapStringsPossiblyChanged(values: string[] | undefined): { value?: string[]; changed: boolean } {
  if (!values) {
    return { changed: false };
  }

  let changed = false;
  const mapped = values.map((value) => {
    const redacted = redactIntegrationPolicyText(value);
    changed = changed || redacted !== value;
    return redacted;
  });

  return changed ? { value: mapped, changed: true } : { value: values, changed: false };
}

export function redactIntegrationPolicyText(value: string): string {
  return redactClassifiedText(value)
    .replace(
      /\b(?:api[_\-\s]?key|apiKey|secret[_\-\s]?key|secretKey|client[_\-\s]?secret|client secret|clientSecret|bearer token|bearerToken|access[_\-\s]?token|accessToken|refresh[_\-\s]?token|refreshToken|session[_\-\s]?token|sessionToken|webhook[_\-\s]?secret|webhookSecret|password|passphrase)\s*[:=]\s*\[redacted-secret\]/gi,
      "[redacted-secret]"
    )
    .replace(/\[redacted-raw-kyc\]\s+(?:packet|file|document|upload|room|dump|csv|spreadsheet)\b/gi, "[redacted-raw-kyc]")
    .replace(/\b(?:passport|driver'?s?\s+license|national\s+id|government\s+id)\s+(?:file|document|record|scan|image|data)\b/gi, "[redacted-identity-document]")
    .replace(legalConclusionPattern, "[redacted-legal-conclusion]")
    .replace(/\s+/g, " ")
    .trim();
}
