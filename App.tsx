import { StatusBar } from 'expo-status-bar';

import { AppNavigator } from './src/navigation/app-navigator';
import { AppStateProvider } from './src/state/app-state';
import { ToastProvider } from './src/state/toast-state';

export default function App(): React.JSX.Element {
  return (
    <ToastProvider>
      <AppStateProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AppStateProvider>
    </ToastProvider>
  );
}
