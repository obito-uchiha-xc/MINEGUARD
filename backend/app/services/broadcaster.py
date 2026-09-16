"""In-Process Telemetry Broadcaster.

Phase 5 Scope: In-process asyncio-based pub/sub broadcaster that fans out
accepted telemetry events to connected WebSocket clients.

Design decisions:
  🔵 D-007 (CLOSED): asyncio.Queue-based in-process broadcaster.
      No external message broker (Redis, Kafka) — prototype scope.
  🔵 D-021: Bounded per-client queue (WS_MAX_QUEUE_SIZE).
      Drop newest event on full queue — slow client policy.
      Historical persistence is NEVER affected by drops.
  🔵 D-024: Optional per-client node_identifier filter.
      None = receive all nodes. Set = receive only matching node events.

Thread safety: All mutations to the client registry go through an asyncio.Lock.
This is sufficient for a single-process ASGI deployment.
"""

import asyncio
import uuid
from typing import Dict, Optional, Union

from backend.app.core.logging import get_logger
from backend.app.schemas.live import (
    LiveAlertEvent,
    LiveAnomalyEvent,
    LiveRiskEvent,
    LiveTelemetryEvent,
)

logger = get_logger(__name__)


class _ClientState:
    """Internal state for a single connected WebSocket client."""

    __slots__ = ("queue", "node_filter")

    def __init__(self, queue: asyncio.Queue, node_filter: Optional[str]) -> None:
        self.queue = queue
        self.node_filter = node_filter  # None = receive all nodes


class TelemetryBroadcaster:
    """In-process asyncio pub/sub broadcaster for live telemetry events.

    One singleton instance is shared across all WebSocket connections.
    Uses a dict of client_id → _ClientState protected by an asyncio.Lock.

    Lifecycle:
      subscribe()   → register a new client
      publish()     → fan-out event to matching clients
      unsubscribe() → deregister and discard client state
    """

    def __init__(self, max_queue_size: int = 50) -> None:
        self._max_queue_size = max_queue_size
        self._clients: Dict[str, _ClientState] = {}
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Client registration
    # ------------------------------------------------------------------

    async def subscribe(
        self,
        node_filter: Optional[str] = None,
    ) -> str:
        """Register a new client and return its unique client_id.

        Args:
            node_filter: Optional node_identifier. If set, client only receives
                         events matching that node. None = all nodes.

        Returns:
            client_id: UUID string identifying this client's subscription.
        """
        client_id = str(uuid.uuid4())
        queue: asyncio.Queue = asyncio.Queue(maxsize=self._max_queue_size)
        state = _ClientState(queue=queue, node_filter=node_filter)

        async with self._lock:
            self._clients[client_id] = state

        logger.info(
            f"WS client subscribed: id={client_id[:8]}… filter={node_filter!r} "
            f"total_clients={len(self._clients)}"
        )
        return client_id

    async def update_filter(
        self,
        client_id: str,
        node_filter: Optional[str],
    ) -> None:
        """Update the node filter for an already-subscribed client.

        Args:
            client_id: The client whose filter to update.
            node_filter: New filter value. None = all nodes.
        """
        async with self._lock:
            if client_id in self._clients:
                self._clients[client_id].node_filter = node_filter
                logger.info(
                    f"WS client filter updated: id={client_id[:8]}… "
                    f"new_filter={node_filter!r}"
                )

    async def unsubscribe(self, client_id: str) -> None:
        """Deregister a client and release its queue.

        Safe to call even if the client_id is not registered.
        """
        async with self._lock:
            state = self._clients.pop(client_id, None)

        if state is not None:
            logger.info(
                f"WS client unsubscribed: id={client_id[:8]}… "
                f"remaining_clients={len(self._clients)}"
            )

    @property
    def client_count(self) -> int:
        """Return the current number of registered clients."""
        return len(self._clients)

    async def shutdown(self) -> None:
        """Gracefully disconnect and release all client queues during application shutdown."""
        async with self._lock:
            count = len(self._clients)
            self._clients.clear()
        logger.info(f"Broadcaster shutdown complete. Disconnected {count} live client(s).")

    # ------------------------------------------------------------------
    # Event publishing
    # ------------------------------------------------------------------

    async def publish(
        self,
        event: Union[LiveTelemetryEvent, LiveAlertEvent, LiveRiskEvent, LiveAnomalyEvent],
    ) -> None:
        """Fan-out a live event (telemetry, alert, risk, or anomaly) to all matching client queues.

        Matching logic (🔵 D-024):
          - client.node_filter is None → receives all events
          - client.node_filter == event.node_identifier → receives this event
          - otherwise → event is not delivered to this client

        Backpressure (🔵 D-021):
          - Uses put_nowait(); if a client's queue is full, the event is dropped
            for that client only (QueueFull caught silently).
          - Historical persistence in the DB is NEVER affected.

        Args:
            event: The LiveTelemetryEvent to broadcast.
        """
        if not self._clients:
            return  # Fast exit — no subscribers

        # Snapshot clients under lock to avoid holding lock during queue ops
        async with self._lock:
            snapshot = list(self._clients.items())

        delivered = 0
        dropped = 0

        for client_id, state in snapshot:
            # Apply node filter
            if state.node_filter is not None and state.node_filter != event.node_identifier:
                continue  # Client is not subscribed to this node

            try:
                state.queue.put_nowait(event)
                delivered += 1
            except asyncio.QueueFull:
                # 🔵 D-021: Drop for slow client — log and continue
                dropped += 1
                logger.warning(
                    f"WS queue full for client={client_id[:8]}…; "
                    f"event dropped for node='{event.node_identifier}'. "
                    f"Historical DB record unaffected."
                )

        if delivered > 0 or dropped > 0:
            logger.debug(
                f"Published telemetry event: node='{event.node_identifier}', "
                f"delivered={delivered}, dropped={dropped}"
            )

    async def get_queue(self, client_id: str) -> Optional[asyncio.Queue]:
        """Return the asyncio.Queue for a registered client, or None."""
        async with self._lock:
            state = self._clients.get(client_id)
            return state.queue if state is not None else None


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

# 🔵 DECISION D-007: Single in-process broadcaster instance shared across
# all ASGI requests and WebSocket connections. Initialized at module import.
# The max_queue_size is set from settings at router startup (see ws.py).
telemetry_broadcaster = TelemetryBroadcaster()
