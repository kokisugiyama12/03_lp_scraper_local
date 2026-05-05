import { getSetting } from "@/lib/db/queries";

export interface TeleapoConfig {
  apiBase: string | null;
  licenseKey: string | null;
  source: {
    apiBase: "db" | "env" | "none";
    licenseKey: "db" | "env" | "none";
  };
}

/**
 * 04 backend の接続設定を取得する。DB の app_settings を優先し、
 * 未設定なら環境変数 (TELEAPO_API_BASE / TELEAPO_LICENSE_KEY) にフォールバック。
 */
export function getTeleapoConfig(): TeleapoConfig {
  const dbApiBase = safeGetSetting("teleapo_api_base");
  const dbLicenseKey = safeGetSetting("teleapo_license_key");

  const envApiBase = process.env.TELEAPO_API_BASE || null;
  const envLicenseKey = process.env.TELEAPO_LICENSE_KEY || null;

  const apiBase = dbApiBase || envApiBase;
  const licenseKey = dbLicenseKey || envLicenseKey;

  return {
    apiBase,
    licenseKey,
    source: {
      apiBase: dbApiBase ? "db" : envApiBase ? "env" : "none",
      licenseKey: dbLicenseKey ? "db" : envLicenseKey ? "env" : "none",
    },
  };
}

function safeGetSetting(key: string): string | null {
  try {
    return getSetting(key);
  } catch {
    return null;
  }
}
