import { CommonComponents } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { GameServerSet } from '../lib/classes';

const { ResourceListView, Link } = CommonComponents;

export function GameServerSetList() {
  return (
    <ResourceListView
      title="Game Server Sets"
      resourceClass={GameServerSet as any}
      columns={[
        'name',
        'namespace',
        {
          id: 'fleet',
          label: 'Fleet',
          getValue: (gss: GameServerSet) => gss.fleetName,
          render: (gss: GameServerSet) =>
            gss.fleetName ? (
              <Link
                routeName="agones-fleet"
                params={{
                  namespace: gss.metadata.namespace ?? '',
                  name: gss.fleetName,
                }}
              >
                {gss.fleetName}
              </Link>
            ) : (
              <span>—</span>
            ),
        },
        {
          id: 'desired',
          label: 'Desired',
          getValue: (gss: GameServerSet) => gss.desiredReplicas,
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: (gss: GameServerSet) => gss.readyReplicas,
        },
        {
          id: 'allocated',
          label: 'Allocated',
          getValue: (gss: GameServerSet) => gss.allocatedReplicas,
        },
        'age',
      ]}
    />
  );
}
