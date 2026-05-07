import { CommonComponents } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { useParams } from 'react-router-dom';
import { GameServerSet, GAMESERVERSET_LABEL } from '../lib/classes';
import { ReplicaSummaryChips } from '../lib/status';
import { ChildGameServerList } from './GameServerList';

const { DetailsGrid, SectionBox, Link } = CommonComponents;

export function GameServerSetDetails() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={GameServerSet as any}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={(gss: GameServerSet) =>
        gss && [
          {
            name: 'Fleet',
            value: gss.fleetName ? (
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
              '—'
            ),
          },
          { name: 'Scheduling', value: gss.spec?.scheduling ?? 'Packed' },
          { name: 'Desired', value: gss.desiredReplicas },
          {
            name: 'Capacity',
            value: (
              <ReplicaSummaryChips
                ready={gss.readyReplicas}
                allocated={gss.allocatedReplicas}
                desired={gss.desiredReplicas}
              />
            ),
          },
        ]
      }
      extraSections={(gss: GameServerSet) =>
        gss
          ? [
              {
                id: 'agones.gameservers',
                section: (
                  <SectionBox title="Game servers in this set">
                    <ChildGameServerList
                      namespace={gss.metadata.namespace ?? ''}
                      labelSelector={`${GAMESERVERSET_LABEL}=${gss.metadata.name}`}
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
