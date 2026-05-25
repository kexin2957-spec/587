type LogLevel = "error" | "info" | "warn";

const sensitiveKeyPattern = /api[_-]?key|authorization|license[_-]?key|secret|service[_-]?role|token/i;

export function logApiError(
  event: string,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  writeStructuredLog("error", event, {
    ...context,
    error: error instanceof Error ? error.message : String(error),
  });
}

export function logSecurityEvent(
  event: string,
  context: Record<string, unknown> = {},
) {
  writeStructuredLog("warn", event, context);
}

export function logMonitoringEvent(
  event: string,
  context: Record<string, unknown> = {},
) {
  writeStructuredLog("info", event, context);
}

function writeStructuredLog(
  level: LogLevel,
  event: string,
  context: Record<string, unknown>,
) {
  const payload = {
    context: redactSensitiveValues(context),
    event,
    level,
    service: "ai-agent-marketplace",
    timestamp: new Date().toISOString(),
  };
  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

function redactSensitiveValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValues);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[redacted]" : redactSensitiveValues(entry),
    ]),
  );
}
