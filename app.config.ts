import type { ConfigContext, ExpoConfig } from 'expo/config';
import appJson from './app.json';

type ExtraMap = Record<string, string | undefined>;
const baseConfig = appJson.expo as unknown as ExpoConfig;

export default ({ config }: ConfigContext): ExpoConfig => {
  const configExtra = (config.extra as ExtraMap | undefined) ?? {};
  const baseExtra = baseConfig.extra ?? {};

  const extra: ExtraMap = {
    ...baseExtra,
    ...configExtra,
    PINATA_JWT: process.env.PINATA_JWT ?? configExtra.PINATA_JWT ?? baseExtra.PINATA_JWT,
    PINATA_API_KEY: process.env.PINATA_API_KEY ?? configExtra.PINATA_API_KEY ?? baseExtra.PINATA_API_KEY,
    PINATA_API_SECRET: process.env.PINATA_API_SECRET ?? configExtra.PINATA_API_SECRET ?? baseExtra.PINATA_API_SECRET,
  };

  return {
    ...baseConfig,
    ...config,
    extra,
  };
};
