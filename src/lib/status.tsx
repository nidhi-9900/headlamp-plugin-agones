// Maps Agones GameServer lifecycle states to a Headlamp StatusLabel tone
// + human-readable label. Source of truth for the state values is
// agones/pkg/apis/agones/v1/gameserver.go (GameServerState* constants).

import { CommonComponents } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import type { GameServerState } from './classes';

const { StatusLabel } = CommonComponents;

type Tone = 'success' | 'warning' | 'error' | '';

// State → (UI tone, friendly text). Operators care about a 3-bucket signal
// (healthy / transitional / broken) more than the literal CRD string.
const STATE_MAP: Record<GameServerState, { tone: Tone; label: string; help: string }> = {
  Ready: { tone: 'success', label: 'Ready', help: 'Available for allocation' },
  Allocated: { tone: 'success', label: 'Allocated', help: 'Serving players' },
  Reserved: { tone: 'success', label: 'Reserved', help: 'Held by SDK, not allocatable' },

  PortAllocation: { tone: 'warning', label: 'Allocating ports', help: 'Controller picking host ports' },
  Creating: { tone: 'warning', label: 'Creating', help: 'Pod being created' },
  Starting: { tone: 'warning', label: 'Starting', help: 'Container starting' },
  Scheduled: { tone: 'warning', label: 'Scheduled', help: 'Pod scheduled, waiting on SDK' },
  RequestReady: { tone: 'warning', label: 'Marking ready', help: 'SDK requested Ready transition' },
  Shutdown: { tone: '', label: 'Shutting down', help: 'Graceful termination in progress' },

  Error: { tone: 'error', label: 'Error', help: 'Controller hit a terminal error' },
  Unhealthy: { tone: 'error', label: 'Unhealthy', help: 'Health check failed' },
};

export function GameServerStateChip({ state }: { state: GameServerState | '' | string }) {
  if (!state) return <span>—</span>;
  const entry = STATE_MAP[state as GameServerState];
  if (!entry) {
    return <StatusLabel status="">{state}</StatusLabel>;
  }
  return (
    <StatusLabel status={entry.tone} title={entry.help}>
      {entry.label}
    </StatusLabel>
  );
}

// Used in the Fleet detail view to roll up child GameServer states into a
// single capacity chip: e.g. "12 ready · 4 allocated".
export function ReplicaSummaryChips(props: {
  ready: number;
  allocated: number;
  reserved?: number;
  desired: number;
}) {
  const { ready, allocated, reserved = 0, desired } = props;
  return (
    <span style={{ display: 'inline-flex', gap: 8 }}>
      <StatusLabel status="success">{ready} ready</StatusLabel>
      <StatusLabel status={allocated > 0 ? 'success' : ''}>{allocated} allocated</StatusLabel>
      {reserved > 0 ? <StatusLabel status="">{reserved} reserved</StatusLabel> : null}
      <StatusLabel status="">{desired} desired</StatusLabel>
    </span>
  );
}
