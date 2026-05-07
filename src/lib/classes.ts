// Typed KubeObject subclasses for Agones CRDs.
//
// Field names mirror the Go structs in
// agones/pkg/apis/agones/v1/{gameserver,fleet,gameserverset}.go so that any
// reader can cross-reference upstream without guesswork.

import { K8s } from '@kinvolk/headlamp-plugin/lib';

const { KubeObject } = K8s.cluster;
type KubeObjectInterface = K8s.cluster.KubeObjectInterface;

export const AGONES_GROUP = 'agones.dev';
export const AGONES_VERSION = 'v1';
export const AGONES_API = `${AGONES_GROUP}/${AGONES_VERSION}`;

// Ownership labels propagated by the Agones controllers.
// gameserverset.go writes both labels onto each GameServer it creates.
export const FLEET_LABEL = 'agones.dev/fleet';
export const GAMESERVERSET_LABEL = 'agones.dev/gameserverset';
export const ROLE_LABEL = 'agones.dev/role';

// GameServer lifecycle states (gameserver.go: GameServerState* constants).
export type GameServerState =
  | 'PortAllocation'
  | 'Creating'
  | 'Starting'
  | 'Scheduled'
  | 'RequestReady'
  | 'Ready'
  | 'Shutdown'
  | 'Error'
  | 'Unhealthy'
  | 'Reserved'
  | 'Allocated';

export interface GameServerPort {
  name?: string;
  portPolicy?: string;
  containerPort?: number;
  hostPort?: number;
  protocol?: string;
}

export interface GameServerStatusPort {
  name: string;
  port: number;
}

export interface KubeGameServer extends KubeObjectInterface {
  spec: {
    container?: string;
    ports?: GameServerPort[];
    health?: {
      disabled?: boolean;
      initialDelaySeconds?: number;
      periodSeconds?: number;
      failureThreshold?: number;
    };
    scheduling?: string;
    sdkServer?: { logLevel?: string; grpcPort?: number; httpPort?: number };
    template: Record<string, any>;
    [k: string]: any;
  };
  status: {
    state: GameServerState;
    ports?: GameServerStatusPort[];
    address?: string;
    addresses?: Array<{ type: string; address: string }>;
    nodeName?: string;
    reservedUntil?: string;
    [k: string]: any;
  };
}

export class GameServer extends KubeObject<KubeGameServer> {
  static kind = 'GameServer';
  static apiName = 'gameservers';
  static apiVersion = AGONES_API;
  static isNamespaced = true;

  get spec() {
    return this.jsonData.spec;
  }
  get status() {
    return this.jsonData.status;
  }
  get state(): GameServerState | '' {
    return this.jsonData.status?.state ?? '';
  }
  get address(): string {
    return this.jsonData.status?.address ?? '';
  }
  // Returns "tcp://1.2.3.4:7777, udp://1.2.3.4:7778" — what an operator wants to copy/paste.
  get connectionString(): string {
    const addr = this.address;
    const ports = this.jsonData.status?.ports ?? [];
    if (!addr || ports.length === 0) return '';
    return ports.map(p => `${addr}:${p.port}`).join(', ');
  }
  get nodeName(): string {
    return this.jsonData.status?.nodeName ?? '';
  }
  get fleetName(): string {
    return this.metadata.labels?.[FLEET_LABEL] ?? '';
  }
  get gameServerSetName(): string {
    return this.metadata.labels?.[GAMESERVERSET_LABEL] ?? '';
  }
}

export interface KubeFleet extends KubeObjectInterface {
  spec: {
    replicas: number;
    scheduling?: string;
    strategy?: { type?: string; rollingUpdate?: Record<string, any> };
    template: { spec: KubeGameServer['spec']; metadata?: Record<string, any> };
    [k: string]: any;
  };
  status: {
    replicas?: number;
    readyReplicas?: number;
    allocatedReplicas?: number;
    reservedReplicas?: number;
    [k: string]: any;
  };
}

export class Fleet extends KubeObject<KubeFleet> {
  static kind = 'Fleet';
  static apiName = 'fleets';
  static apiVersion = AGONES_API;
  static isNamespaced = true;

  get spec() {
    return this.jsonData.spec;
  }
  get status() {
    return this.jsonData.status ?? {};
  }
  get desiredReplicas(): number {
    return this.spec?.replicas ?? 0;
  }
  get readyReplicas(): number {
    return this.status.readyReplicas ?? 0;
  }
  get allocatedReplicas(): number {
    return this.status.allocatedReplicas ?? 0;
  }
  get reservedReplicas(): number {
    return this.status.reservedReplicas ?? 0;
  }
  get totalReplicas(): number {
    return this.status.replicas ?? 0;
  }
}

export interface KubeGameServerSet extends KubeObjectInterface {
  spec: {
    replicas: number;
    scheduling?: string;
    template: KubeFleet['spec']['template'];
    [k: string]: any;
  };
  status: {
    replicas?: number;
    readyReplicas?: number;
    allocatedReplicas?: number;
    reservedReplicas?: number;
    shutdownReplicas?: number;
    [k: string]: any;
  };
}

export class GameServerSet extends KubeObject<KubeGameServerSet> {
  static kind = 'GameServerSet';
  static apiName = 'gameserversets';
  static apiVersion = AGONES_API;
  static isNamespaced = true;

  get spec() {
    return this.jsonData.spec;
  }
  get status() {
    return this.jsonData.status ?? {};
  }
  get desiredReplicas(): number {
    return this.spec?.replicas ?? 0;
  }
  get readyReplicas(): number {
    return this.status.readyReplicas ?? 0;
  }
  get allocatedReplicas(): number {
    return this.status.allocatedReplicas ?? 0;
  }
  get fleetName(): string {
    return this.metadata.labels?.[FLEET_LABEL] ?? '';
  }
}
