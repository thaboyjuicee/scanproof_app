import { StatusBar } from 'expo-status-bar';

import { AppNavigator } from './src/navigation/app-navigator';
import { AppStateProvider } from './src/state/app-state';

export default function App(): React.JSX.Element {
  return (
    <AppStateProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </AppStateProvider>
  );
}
