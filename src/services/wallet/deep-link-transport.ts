import * as Linking from 'expo-linking';

import { AppError } from '../../utils/errors';

export class ExpoDeepLinkTransport {
  async openAndWait(url: string, redirectBase: string, timeoutMs = 90000): Promise<Record<string, string>> {
    return new Promise<Record<string, string>>((resolve, reject) => {
      let settled = false;

      const cleanupAndReject = (error: Error): void => {
        if (!settled) {
          settled = true;
          subscription.remove();
          clearTimeout(timeoutHandle);
          reject(error);
        }
      };

      const cleanupAndResolve = (params: Record<string, string>): void => {
        if (!settled) {
          settled = true;
          subscription.remove();
          clearTimeout(timeoutHandle);
          resolve(params);
        }
      };

      const subscription = Linking.addEventListener('url', (event) => {
        if (!event.url.startsWith(redirectBase)) {
          return;
        }

        const parsed = Linking.parse(event.url);
        const queryParams = parsed.queryParams ?? {};
        const flatParams: Record<string, string> = {};

        Object.entries(queryParams).forEach(([key, value]) => {
          if (typeof value === 'string') {
            flatParams[key] = value;
          }
        });

        if (flatParams.errorCode || flatParams.errorMessage) {
          cleanupAndReject(new AppError(flatParams.errorMessage ?? 'Wallet operation failed', flatParams.errorCode ?? 'WALLET_UNKNOWN_ERROR'));
          return;
        }

        cleanupAndResolve(flatParams);
      });

      const timeoutHandle = setTimeout(() => {
        cleanupAndReject(new AppError('Wallet deep link callback timed out.', 'WALLET_TIMEOUT'));
      }, timeoutMs);

      Linking.openURL(url).catch((error) => {
        cleanupAndReject(new AppError(`Unable to open wallet URL: ${String(error)}`, 'WALLET_OPEN_URL_FAILED'));
      });
    });
  }
}
