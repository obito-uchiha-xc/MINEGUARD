"""WebSocket Live Telemetry Endpoint.

Phase 5 Scope: Accepts WebSocket connections and delivers live telemetry events
to connected clients via the TelemetryBroadcaster.

Design decisions:
  🔵 D-004 (CLOSED): WebSockets selected as live transport.
  🔵 D-022: Server-initiated keepalive ping every WS_KEEPALIVE_INTERVAL_S seconds.
  🔵 D-023: Endpoint is unauthenticated in Phase 5 (auth is TBD per D-006).
  🔵 D-024: Client may send a SubscriptionMessage to filter by node_identifier.

Connection Lifecycle:
  1. CONNECT  → accept, generate client_id, subscribe to broadcaster (no filter).
  2. SUBSCRIBE → client optionally sends {"action":"subscribe","node_identifier":"..."}.
                 Broadcaster filter updated; all telemetry is received until this message.
  3. ACTIVE   → sender task drains client queue → sends JSON frames.
                 keepalive task sends {"event_type":"ping"} every interval seconds.
  4. DISCONNECT → unsubscribe, cancel both tasks, release resources.

Error isolation:
  - WebSocketDisconnect or send failure in one client does NOT affect other clients.
  - DB persistence path is completely independent of this endpoint.
"""

import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.app.core.config import get_settings
from backend.app.core.logging import get_logger
from backend.app.schemas.live import KeepalivePing, SubscriptionMessage
from backend.app.services.broadcaster import telemetry_broadcaster

logger = get_logger(__name__)
settings = get_settings()

router = APIRouter(tags=["Live Monitoring"])


@router.websocket("/ws/telemetry")
async def ws_live_telemetry(websocket: WebSocket) -> None:
    """WebSocket endpoint for live telemetry delivery.

    Clients connect to this endpoint to receive real-time telemetry events
    as they are ingested and persisted by the backend.

    Subscription message (optional, sent after connect):
        {"action": "subscribe", "node_identifier": "NODE-01"}
        If omitted, client receives telemetry from ALL nodes.

    Server messages:
        Telemetry event:
            {"event_type": "telemetry", "node_identifier": "...", "readings": [...], ...}
        Keepalive ping:
            {"event_type": "ping", "server_time": "..."}

    🔵 D-023: No authentication in Phase 5. Auth is TBD (D-006).
    """
    await websocket.accept()

    # Register client with broadcaster (no filter yet — receives all nodes)
    client_id = await telemetry_broadcaster.subscribe(node_filter=None)
    queue = await telemetry_broadcaster.get_queue(client_id)

    logger.info(f"WS connection accepted: client={client_id[:8]}…")

    # -----------------------------------------------------------------------
    # Inner tasks
    # -----------------------------------------------------------------------

    async def _sender() -> None:
        """Drain the client queue and forward events as JSON frames."""
        try:
            while True:
                event = await queue.get()
                try:
                    await websocket.send_text(event.model_dump_json())
                except WebSocketDisconnect:
                    logger.info(f"WS client disconnected during send: {client_id[:8]}…")
                    return
                except Exception as send_err:
                    # 🔵 D-021/Error isolation: one client send failure is non-fatal.
                    logger.warning(
                        f"WS send error for client={client_id[:8]}…: {send_err}"
                    )
                    return
        except asyncio.CancelledError:
            pass

    async def _keepalive() -> None:
        """Send a ping frame every WS_KEEPALIVE_INTERVAL_S seconds.

        🔵 D-022: Lightweight keepalive — NOT a safety requirement.
        """
        try:
            while True:
                await asyncio.sleep(settings.WS_KEEPALIVE_INTERVAL_S)
                ping = KeepalivePing(server_time=datetime.now(timezone.utc))
                try:
                    await websocket.send_text(ping.model_dump_json())
                except WebSocketDisconnect:
                    return
                except Exception:
                    return
        except asyncio.CancelledError:
            pass

    sender_task = asyncio.create_task(_sender())
    keepalive_task = asyncio.create_task(_keepalive())

    try:
        # -----------------------------------------------------------------------
        # Receive loop — handle optional subscription message + detect disconnect
        # -----------------------------------------------------------------------
        while True:
            try:
                raw = await websocket.receive_text()
            except WebSocketDisconnect:
                logger.info(f"WS client disconnected: {client_id[:8]}…")
                break

            # Parse optional subscription message (🔵 D-024)
            try:
                data = json.loads(raw)
                sub_msg = SubscriptionMessage.model_validate(data)
                await telemetry_broadcaster.update_filter(
                    client_id=client_id,
                    node_filter=sub_msg.node_identifier,
                )
                logger.info(
                    f"WS client={client_id[:8]}… subscribed to "
                    f"node_identifier={sub_msg.node_identifier!r}"
                )
                # Acknowledge subscription
                await websocket.send_text(
                    json.dumps({
                        "event_type": "subscribed",
                        "node_identifier": sub_msg.node_identifier,
                    })
                )
            except Exception:
                # Unrecognised client message — ignore gracefully, do not crash
                preview = repr(raw)[:80]
                logger.debug(
                    f"WS client={client_id[:8]}… sent unrecognised message: {preview}"
                )

    finally:
        # -----------------------------------------------------------------------
        # Cleanup: always runs on disconnect or unhandled exception
        # -----------------------------------------------------------------------
        # 1. Unsubscribe immediately so client is removed from broadcaster registry
        try:
            await asyncio.shield(telemetry_broadcaster.unsubscribe(client_id))
        except BaseException as unsub_err:
            logger.warning(f"Error unsubscribing client={client_id[:8]}…: {unsub_err}")

        # 2. Cancel background helper tasks
        sender_task.cancel()
        keepalive_task.cancel()
        logger.info(f"WS connection cleaned up: client={client_id[:8]}…")



