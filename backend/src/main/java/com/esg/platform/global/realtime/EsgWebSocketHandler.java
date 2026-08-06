package com.esg.platform.global.realtime;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;


@Component
public class EsgWebSocketHandler extends TextWebSocketHandler {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(EsgWebSocketHandler.class);
    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final Map<Long, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();

    public EsgWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = userIdOf(session);
        if (userId == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }
        sessions.add(session);
        sessionsByUser.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
        log.info("[WEBSOCKET] 연결 userId={} sessionId={}", userId, session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        Long userId = userIdOf(session);
        if (userId != null) {
            Set<WebSocketSession> userSessions = sessionsByUser.get(userId);
            if (userSessions != null) {
                userSessions.remove(session);
                if (userSessions.isEmpty()) {
                    sessionsByUser.remove(userId);
                }
            }
        }
        log.info("[WEBSOCKET] 연결 종료 userId={} sessionId={} status={}",
                userId, session.getId(), status.getCode());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("[WEBSOCKET] 전송 오류 userId={} sessionId={} reason={}",
                userIdOf(session), session.getId(), exception.getClass().getSimpleName());
    }

    public void broadcast(Object event) {
        TextMessage message = serialize(event);
        for (WebSocketSession session : sessions) {
            send(session, message);
        }
    }

    public void sendToUser(Long userId, Object event) {
        if (userId == null) {
            return;
        }
        TextMessage message = serialize(event);
        Set<WebSocketSession> userSessions = sessionsByUser.getOrDefault(userId, Set.of());
        for (WebSocketSession session : userSessions) {
            send(session, message);
        }
    }

    public void sendToRoles(Set<String> roles, Object event) {
        if (roles == null || roles.isEmpty()) {
            return;
        }
        TextMessage message = serialize(event);
        for (WebSocketSession session : sessions) {
            String role = roleOf(session);
            if (role != null && roles.contains(role)) {
                send(session, message);
            }
        }
    }

    private TextMessage serialize(Object event) {
        try {
            return new TextMessage(objectMapper.writeValueAsString(event));
        } catch (Exception exception) {
            throw new IllegalStateException("WebSocket event serialization failed", exception);
        }
    }

    private void send(WebSocketSession session, TextMessage message) {
        if (!session.isOpen()) {
            return;
        }
        try {
            synchronized (session) {
                session.sendMessage(message);
            }
        } catch (IOException exception) {
            log.warn("[WEBSOCKET] 메시지 전송 실패 userId={} sessionId={}",
                    userIdOf(session), session.getId());
        }
    }

    private Long userIdOf(WebSocketSession session) {
        Object value = session.getAttributes().get(JwtWebSocketHandshakeInterceptor.ATTR_USER_ID);
        if (value instanceof Long userId) {
            return userId;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private String roleOf(WebSocketSession session) {
        Object value = session.getAttributes().get(JwtWebSocketHandshakeInterceptor.ATTR_ROLE);
        return value == null ? null : String.valueOf(value);
    }
}
