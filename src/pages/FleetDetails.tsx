import { CommonComponents } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Fleet,
  GameServerSet,
  FLEET_LABEL,
} from '../lib/classes';
import { ReplicaSummaryChips } from '../lib/status';
import { ChildGameServerList } from './GameServerList';

const { DetailsGrid, SectionBox, ResourceListView, Link } = CommonComponents;

export function FleetDetails() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={Fleet as any}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={(f: Fleet) =>
        f && [
          { name: 'Scheduling', value: f.spec?.scheduling ?? 'Packed' },
          {
            name: 'Strategy',
            value: f.spec?.strategy?.type ?? '—',
          },
          { name: 'Desired', value: f.desiredReplicas },
          {
            name: 'Capacity',
            value: (
              <ReplicaSummaryChips
                ready={f.readyReplicas}
                allocated={f.allocatedReplicas}
                reserved={f.reservedReplicas}
                desired={f.desiredReplicas}
              />
            ),
          },
        ]
      }
      extraSections={(f: Fleet) =>
        f
          ? [
              {
                id: 'agones.gameserversets',
                section: (
                  <OwnedGameServerSets
                    namespace={f.metadata.namespace ?? ''}
                    fleetName={f.metadata.name}
                  />
                ),
              },
              {
                id: 'agones.gameservers',
                section: (
                  <SectionBox title="Game servers in this fleet">
                    <ChildGameServerList
                      namespace={f.metadata.namespace ?? ''}
                      labelSelector={`${FLEET_LABEL}=${f.metadata.name}`}
                    />
                  </SectionBox>
                ),
              },
            ]
          : []
      }
    />
  );
}

function OwnedGameServerSets(props: { namespace: string; fleetName: string }) {
  const { namespace, fleetName } = props;
  const [items] = (GameServerSet as any).useList({
    namespace,
    labelSelector: `${FLEET_LABEL}=${fleetName}`,
  }) as [GameServerSet[] | null, any];

  return (
    <ResourceListView
      title="GameServerSets"
      data={items}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getValue: (gss: GameServerSet) => gss.metadata.name,
          render: (gss: GameServerSet) => (
            <Link
              routeName="agones-gameserverset"
              params={{
                namespace: gss.metadata.namespace ?? '',
                name: gss.metadata.name,
              }}
            >
              {gss.metadata.name}
            </Link>
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
