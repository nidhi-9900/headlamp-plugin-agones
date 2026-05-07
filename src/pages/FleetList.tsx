import { CommonComponents } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { Fleet } from '../lib/classes';
import { ReplicaSummaryChips } from '../lib/status';

const { ResourceListView } = CommonComponents;

export function FleetList() {
  return (
    <ResourceListView
      title="Fleets"
      resourceClass={Fleet as any}
      columns={[
        'name',
        'namespace',
        {
          id: 'desired',
          label: 'Desired',
          getValue: (f: Fleet) => f.desiredReplicas,
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: (f: Fleet) => f.readyReplicas,
        },
        {
          id: 'allocated',
          label: 'Allocated',
          getValue: (f: Fleet) => f.allocatedReplicas,
        },
        {
          id: 'capacity',
          label: 'Capacity',
          getValue: (f: Fleet) => `${f.readyReplicas}/${f.desiredReplicas}`,
          render: (f: Fleet) => (
            <ReplicaSummaryChips
              ready={f.readyReplicas}
              allocated={f.allocatedReplicas}
              reserved={f.reservedReplicas}
              desired={f.desiredReplicas}
            />
          ),
        },
        'age',
      ]}
    />
  );
}
