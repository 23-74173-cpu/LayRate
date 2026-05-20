import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CageManagement } from './pages/CageManagement';
import { EggLogging } from './pages/EggLogging';
import { Environment } from './pages/Environment';
import { FeedNutrition } from './pages/FeedNutrition';
import { Analytics } from './pages/Analytics';
import { Forecast } from './pages/Forecast';
import { Reports } from './pages/Reports';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'cages', Component: CageManagement },
      { path: 'egg-logging', Component: EggLogging },
      { path: 'environment', Component: Environment },
      { path: 'feed', Component: FeedNutrition },
      { path: 'analytics', Component: Analytics },
      { path: 'forecast', Component: Forecast },
      { path: 'reports', Component: Reports },
    ],
  },
]);