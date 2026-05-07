/// <reference types="@kinvolk/headlamp-plugin" />

// Entry point: wires the Agones section of the Headlamp sidebar, registers
// the routes for list + details views, and tells Headlamp which icon to use
// when it encounters our CRDs anywhere else in the UI (e.g. the cluster Map).

import {
  registerKindIcon,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { Icon } from '@iconify/react';
import React from 'react';
import { FleetDetails } from './pages/FleetDetails';
import { FleetList } from './pages/FleetList';
import { GameServerDetails } from './pages/GameServerDetails';
import { GameServerList } from './pages/GameServerList';
import { GameServerSetDetails } from './pages/GameServerSetDetails';
import { GameServerSetList } from './pages/GameServerSetList';

// Sidebar layout:
//   Agones
//   ├── Game Servers
//   ├── Fleets
//   └── Game Server Sets
registerSidebarEntry({
  parent: null,
  name: 'agones',
  label: 'Agones',
  url: '/agones/gameservers',
  icon: 'mdi:gamepad-variant',
});

registerSidebarEntry({
  parent: 'agones',
  name: 'agones-gameservers',
  label: 'Game Servers',
  url: '/agones/gameservers',
  icon: 'mdi:server',
});

registerSidebarEntry({
  parent: 'agones',
  name: 'agones-fleets',
  label: 'Fleets',
  url: '/agones/fleets',
  icon: 'mdi:layers-triple',
});

registerSidebarEntry({
  parent: 'agones',
  name: 'agones-gameserversets',
  label: 'Game Server Sets',
  url: '/agones/gameserversets',
  icon: 'mdi:server-network',
});

// ---- Routes ----------------------------------------------------------------

registerRoute({
  path: '/agones/gameservers',
  sidebar: 'agones-gameservers',
  name: 'agones-gameservers',
  exact: true,
  component: () => <GameServerList />,
});

registerRoute({
  // Route name is referenced by Link from Fleet/GameServerSet pages.
  path: '/agones/gameservers/:namespace/:name',
  sidebar: 'agones-gameservers',
  name: 'agones-gameserver',
  exact: true,
  component: () => <GameServerDetails />,
});

registerRoute({
  path: '/agones/fleets',
  sidebar: 'agones-fleets',
  name: 'agones-fleets',
  exact: true,
  component: () => <FleetList />,
});

registerRoute({
  path: '/agones/fleets/:namespace/:name',
  sidebar: 'agones-fleets',
  name: 'agones-fleet',
  exact: true,
  component: () => <FleetDetails />,
});

registerRoute({
  path: '/agones/gameserversets',
  sidebar: 'agones-gameserversets',
  name: 'agones-gameserversets',
  exact: true,
  component: () => <GameServerSetList />,
});

registerRoute({
  path: '/agones/gameserversets/:namespace/:name',
  sidebar: 'agones-gameserversets',
  name: 'agones-gameserverset',
  exact: true,
  component: () => <GameServerSetDetails />,
});

// ---- Kind icons ------------------------------------------------------------
// Headlamp renders these icons in the cluster Map view and anywhere a
// KubeObject is referenced by kind. Without this, Agones CRDs fall back to
// the generic CRD icon — easy to overlook in a busy graph.
// The published @kinvolk/headlamp-plugin lib (0.13.x) does not yet expose the
// optional apiGroup parameter, so we register by kind only. Kind names here
// don't collide with anything in the standard Kubernetes API surface.
registerKindIcon('GameServer', { icon: <Icon icon="mdi:gamepad-variant" /> });
registerKindIcon('Fleet', { icon: <Icon icon="mdi:layers-triple" /> });
registerKindIcon('GameServerSet', { icon: <Icon icon="mdi:server-network" /> });
