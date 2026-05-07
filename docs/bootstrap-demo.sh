#!/usr/bin/env bash
# bootstrap-demo.sh — create a local kind cluster, install Agones, and apply a
# tiny mix of Fleet manifests + one allocation so the Headlamp plugin has
# something interesting to render across all three list views (Ready,
# Allocated, and a transitional state).
#
# Behavior:
#   * Idempotent. Re-running on an existing `agones-demo` cluster reuses it.
#     Pass FRESH=1 to tear down and recreate from scratch.
#   * Streams progress so it never looks "stuck". Helm's
#     "Warning: unrecognized format" lines are cosmetic — they come from
#     kubectl validating Agones CRDs against its OpenAPI parser and are safe
#     to ignore. We filter them out for clarity.
#
# Usage:
#   ./docs/bootstrap-demo.sh
#   FRESH=1 ./docs/bootstrap-demo.sh
#   CLUSTER=mycluster ./docs/bootstrap-demo.sh

set -euo pipefail

CLUSTER=${CLUSTER:-agones-demo}
AGONES_VERSION=${AGONES_VERSION:-1.45.0}
FRESH=${FRESH:-0}

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!! \033[0m %s\n' "$*"; }
die() { printf '\033[1;31mxx \033[0m %s\n' "$*" >&2; exit 1; }

# Strip helm/kubectl's noisy format warnings, leave everything else intact.
silence_format_warnings() {
  grep -v 'unrecognized format' || true
}

for tool in kind kubectl helm; do
  command -v "$tool" >/dev/null || die "$tool not found in PATH"
done

# 1. kind cluster --------------------------------------------------------------
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER}$"; then
  if [[ "$FRESH" == "1" ]]; then
    log "Deleting existing kind cluster ${CLUSTER} (FRESH=1)"
    kind delete cluster --name "${CLUSTER}"
  else
    log "Reusing existing kind cluster ${CLUSTER}"
  fi
fi

if ! kind get clusters 2>/dev/null | grep -q "^${CLUSTER}$"; then
  log "Creating kind cluster ${CLUSTER} (this takes ~30s)"
  cat <<EOF | kind create cluster --name "${CLUSTER}" --config - --wait 60s
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - { containerPort: 7000, hostPort: 7000, protocol: UDP }
      - { containerPort: 7001, hostPort: 7001, protocol: UDP }
      - { containerPort: 7002, hostPort: 7002, protocol: UDP }
EOF
fi

CTX="kind-${CLUSTER}"
kubectl --context "$CTX" cluster-info >/dev/null || die "cluster context $CTX not reachable"

# 2. Agones --------------------------------------------------------------------
if kubectl --context "$CTX" get ns agones-system >/dev/null 2>&1 \
   && kubectl --context "$CTX" -n agones-system get deploy agones-controller >/dev/null 2>&1; then
  log "Agones already installed, skipping helm upgrade"
else
  log "Installing Agones ${AGONES_VERSION} via Helm (this takes ~2 min)"
  helm repo add agones https://agones.dev/chart/stable >/dev/null 2>&1 || true
  helm repo update >/dev/null
  kubectl --context "$CTX" create namespace agones-system >/dev/null 2>&1 || true

  # --wait blocks helm until all pods are Ready. We pipe stderr through the
  # format-warning filter so progress remains readable.
  helm --kube-context "$CTX" upgrade --install agones agones/agones \
    --namespace agones-system \
    --version "${AGONES_VERSION}" \
    --set "agones.controller.replicas=1" \
    --set "agones.ping.replicas=1" \
    --set "agones.allocator.replicas=1" \
    --wait --timeout 5m 2> >(silence_format_warnings >&2) \
    || die "helm install failed — try FRESH=1 to retry from a clean slate"
fi

log "Waiting for Agones CRDs to become Established"
kubectl --context "$CTX" wait --for=condition=Established --timeout=120s \
  crd/gameservers.agones.dev crd/fleets.agones.dev crd/gameserversets.agones.dev \
  >/dev/null

# 3. Demo fleets ---------------------------------------------------------------
if kubectl --context "$CTX" get fleet simple-game-server -n default >/dev/null 2>&1; then
  log "Demo fleets already present, skipping apply"
else
  log "Applying demo fleets: simple-game-server (3 replicas) + xonotic (2 replicas)"
  kubectl --context "$CTX" apply -f - <<'EOF' 2> >(silence_format_warnings >&2)
apiVersion: agones.dev/v1
kind: Fleet
metadata:
  name: simple-game-server
  namespace: default
spec:
  replicas: 3
  template:
    spec:
      ports:
        - name: default
          containerPort: 7654
          portPolicy: Dynamic
          protocol: UDP
      health:
        initialDelaySeconds: 5
        periodSeconds: 10
      template:
        spec:
          containers:
            - name: simple-game-server
              image: us-docker.pkg.dev/agones-images/examples/simple-game-server:0.27
              resources:
                requests: { cpu: 20m, memory: 32Mi }
                limits:   { cpu: 100m, memory: 64Mi }
---
apiVersion: agones.dev/v1
kind: Fleet
metadata:
  name: xonotic
  namespace: default
spec:
  replicas: 2
  template:
    spec:
      ports:
        - name: default
          portPolicy: Dynamic
          containerPort: 26000
          protocol: UDP
      template:
        spec:
          containers:
            - name: xonotic
              image: us-docker.pkg.dev/agones-images/examples/xonotic-example:1.4
              resources:
                requests: { cpu: 100m, memory: 200Mi }
                limits:   { cpu: 500m, memory: 700Mi }
EOF
fi

log "Waiting for at least 2 GameServers in simple-game-server to reach Ready"
for i in $(seq 1 30); do
  ready=$(kubectl --context "$CTX" get fleet simple-game-server \
            -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
  ready=${ready:-0}
  printf '   tick %2d/30 — ready=%s\n' "$i" "$ready"
  if [[ "$ready" -ge 2 ]]; then break; fi
  sleep 5
done

# 4. Allocation ----------------------------------------------------------------
if kubectl --context "$CTX" get gs -n default \
     -o jsonpath='{.items[?(@.status.state=="Allocated")].metadata.name}' \
     2>/dev/null | grep -q .; then
  log "An Allocated GameServer already exists, skipping allocation"
else
  log "Allocating one GameServer so 'Allocated' state appears in the list"
  kubectl --context "$CTX" apply -f - <<'EOF' 2> >(silence_format_warnings >&2)
apiVersion: allocation.agones.dev/v1
kind: GameServerAllocation
metadata:
  name: demo-allocation
  namespace: default
spec:
  selectors:
    - matchLabels:
        agones.dev/fleet: simple-game-server
EOF
fi

# 5. Summary -------------------------------------------------------------------
echo
log "Done. Snapshot of the demo cluster:"
echo
kubectl --context "$CTX" get fleet,gss,gs -n default
echo
cat <<MSG
Next steps:
  1. kubectl config use-context $CTX
  2. cd $(dirname "$0")/..
  3. npm install       # if you have not already
  4. npm start         # serves the plugin in dev mode
  5. Start Headlamp pointed at this cluster.

To wipe and start over:
  FRESH=1 $0
MSG
