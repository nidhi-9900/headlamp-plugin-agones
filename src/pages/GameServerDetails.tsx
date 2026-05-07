import { CommonComponents } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { useParams } from 'react-router-dom';
import { GameServer, FLEET_LABEL, GAMESERVERSET_LABEL } from '../lib/classes';
import { GameServerStateChip } from '../lib/status';

const { DetailsGrid, SectionBox, NameValueTable, Link } = CommonComponents;

export function GameServerDetails() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={GameServer as any}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={(gs: GameServer) =>
        gs && [
          { name: 'State', value: <GameServerStateChip state={gs.state} /> },
          { name: 'Address', value: gs.address || '—' },
          {
            name: 'Connection',
            value: gs.connectionString || '—',
          },
          {
            name: 'Node',
            value: gs.nodeName ? (
              <Link routeName="node" params={{ name: gs.nodeName }}>
                {gs.nodeName}
              </Link>
            ) : (
              '—'
            ),
          },
          {
            name: 'Fleet',
            value: gs.fleetName ? (
              <Link
                routeName="agones-fleet"
                params={{ namespace: gs.metadata.namespace ?? '', name: gs.fleetName }}
              >
                {gs.fleetName}
              </Link>
            ) : (
              '—'
            ),
          },
          {
            name: 'GameServerSet',
            value: gs.gameServerSetName ? (
              <Link
                routeName="agones-gameserverset"
                params={{
                  namespace: gs.metadata.namespace ?? '',
                  name: gs.gameServerSetName,
                }}
              >
                {gs.gameServerSetName}
              </Link>
            ) : (
              '—'
            ),
          },
          { name: 'Reserved until', value: gs.status?.reservedUntil ?? '—' },
        ]
      }
      extraSections={(gs: GameServer) =>
        gs
          ? [
              {
                id: 'agones.ports',
                section: <PortsSection gs={gs} />,
              },
              {
                id: 'agones.health',
                section: <HealthSection gs={gs} />,
              },
              {
                id: 'agones.related-pod',
                section: <RelatedPodSection gs={gs} />,
              },
            ]
          : []
      }
    />
  );
}

function PortsSection({ gs }: { gs: GameServer }) {
  const specPorts = gs.spec?.ports ?? [];
  const statusPorts = gs.status?.ports ?? [];

  // Join spec ports (definition) with status ports (assigned host port).
  // The portPolicy on the spec side explains *why* a host port is what it is.
  const rows = specPorts.length
    ? specPorts.map(p => {
        const assigned = statusPorts.find(sp => sp.name === p.name);
        return {
          name: p.name ?? '—',
          policy: p.portPolicy ?? '—',
          container: p.containerPort ?? '—',
          host: assigned?.port ?? p.hostPort ?? '—',
          protocol: p.protocol ?? 'UDP',
        };
      })
    : statusPorts.map(p => ({
        name: p.name,
        policy: '—',
        container: '—',
        host: p.port,
        protocol: '—',
      }));

  return (
    <SectionBox title="Ports">
      {rows.length === 0 ? (
        <NameValueTable rows={[{ name: 'Ports', value: 'No ports declared' }]} />
      ) : (
        <NameValueTable
          rows={rows.map(r => ({
            name: r.name,
            value: `policy=${r.policy} · container=${r.container} · host=${r.host} · ${r.protocol}`,
          }))}
        />
      )}
    </SectionBox>
  );
}

function HealthSection({ gs }: { gs: GameServer }) {
  const h = gs.spec?.health ?? {};
  return (
    <SectionBox title="Health check">
      <NameValueTable
        rows={[
          { name: 'Disabled', value: String(h.disabled ?? false) },
          { name: 'Initial delay (s)', value: String(h.initialDelaySeconds ?? '—') },
          { name: 'Period (s)', value: String(h.periodSeconds ?? '—') },
          { name: 'Failure threshold', value: String(h.failureThreshold ?? '—') },
        ]}
      />
    </SectionBox>
  );
}

// The underlying GameServer pod is created with the same name as the
// GameServer (see agones/pkg/apis/agones/v1/gameserver.go::Pod()), so a
// direct link is reliable enough for a PoC.
function RelatedPodSection({ gs }: { gs: GameServer }) {
  const ns = gs.metadata.namespace ?? '';
  return (
    <SectionBox title="Backing pod">
      <NameValueTable
        rows={[
          {
            name: 'Pod',
            value: (
              <Link routeName="Pod" params={{ namespace: ns, name: gs.metadata.name }}>
                {ns}/{gs.metadata.name}
              </Link>
            ),
          },
          { name: 'Role label', value: `${FLEET_LABEL}/${GAMESERVERSET_LABEL}` },
        ]}
      />
    </SectionBox>
  );
}
