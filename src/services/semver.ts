export function parseRawVersion(rawVersion: string): string {
  const version = rawVersion.replace(/[^0-9.]/g, '');
  return version;
}
