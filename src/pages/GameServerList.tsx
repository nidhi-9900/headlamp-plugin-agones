import { CommonComponents } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { GameServer, FLEET_LABEL } from '../lib/classes';
import { GameServerStateChip } from '../lib/status';

const { ResourceListView, Link } = CommonComponents;

export function GameServerList() {
  return (
    <ResourceListView
      title="Game Servers"
      resourceClass={GameServer as any}
      columns={[
        'name',
        'namespace',
        {
          id: 'state',
          label: 'State',
          getValue: (gs: GameServer) => gs.state,
          render: (gs: GameServer) => <GameServerStateChip state={gs.state} />,
        },
        {
          id: 'address',
          label: 'Address',
          getValue: (gs: GameServer) => gs.connectionString || gs.address || '',
        },
        {
          id: 'node',
          label: 'Node',
          getValue: (gs: GameServer) => gs.nodeName || '',
          render: (gs: GameServer) =>
            gs.nodeName ? (
              <Link routeName="node" params={{ name: gs.nodeName }}>
                {gs.nodeName}
              </Link>
            ) : (
              <span>—</span>
            ),
        },
        {
          id: 'fleet',
          label: 'Fleet',
          getValue: (gs: GameServer) => gs.fleetName || '',
          render: (gs: GameServer) =>
            gs.fleetName ? (
              <Link
                routeName="agones-fleet"
                params={{ namespace: gs.metadata.namespace ?? '', name: gs.fleetName }}
              >
                {gs.fleetName}
              </Link>
            ) : (
              <span>—</span>
            ),
        },
        'age',
      ]}
    />
  );
}

// Used by Fleet/GameServerSet detail pages: a scoped GameServer list filtered
// by ownership label. Renders empty-state if the owner has no children yet.
export function ChildGameServerList(props: { namespace: string; labelSelector: string }) {
  const { namespace, labelSelector } = props;
  const [items] = (GameServer as any).useList({ namespace, labelSelector }) as [
    GameServer[] | null,
    any,
  ];

  return (
    <ResourceListView
      title="Game Servers"
      data={items}
      columns={[
        'name',
        {
          id: 'state',
          label: 'State',
          getValue: (gs: GameServer) => gs.state,
          render: (gs: GameServer) => <GameServerStateChip state={gs.state} />,
        },
        {
          id: 'address',
          label: 'Address',
          getValue: (gs: GameServer) => gs.connectionString || gs.address || '',
        },
        {
          id: 'node',
          label: 'Node',
          getValue: (gs: GameServer) => gs.nodeName || '',
          render: (gs: GameServer) =>
            gs.nodeName ? (
              <Link routeName="node" params={{ name: gs.nodeName }}>
                {gs.nodeName}
              </Link>
            ) : (
              <span>—</span>
            ),
        },
        'age',
      ]}
      // Used so the prop reaches downstream consumers, but the label-scoped
      // list does not need a Create button.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      enableRowActions={false}
    />
  );
}

export { FLEET_LABEL };
