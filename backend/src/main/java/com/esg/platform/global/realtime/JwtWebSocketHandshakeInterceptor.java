package com.esg.platform.global.realtime;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import com.esg.platform.global.security.EsgUserDetailsService;
import com.esg.platform.global.security.EsgUserPrincipal;
import com.esg.platform.global.security.JwtTokenProvider;
import com.esg.platform.global.security.JwtTokenType;
import com.esg.platform.global.security.RedisTokenService;

import io.jsonwebtoken.Claims;

@Component
public class JwtWebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtWebSocketHandshakeInterceptor.class);

    public static final String ATTR_USER_ID = "esgUserId";
    public static final String ATTR_ROLE = "esgUserRole";

    private final JwtTokenProvider tokenProvider;
    private final RedisTokenService redisTokenService;
    private final EsgUserDetailsService userDetailsService;

    public JwtWebSocketHandshakeInterceptor(
            JwtTokenProvider tokenProvider,
            RedisTokenService redisTokenService,
            EsgUserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.redisTokenService = redisTokenService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        String token = UriComponentsBuilder.fromUri(request.getURI())
                .build()
                .getQueryParams()
                .getFirst("token");
        if (!StringUtils.hasText(token)) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            Claims claims = tokenProvider.parseExpected(token, JwtTokenType.ACCESS);
            Long userId = tokenProvider.getUserId(claims);
            String jti = tokenProvider.getJti(claims);
            if (redisTokenService.isBlacklisted(jti)) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            EsgUserPrincipal principal = userDetailsService.loadById(userId);
            if (!principal.isEnabled()
                    || principal.getUser().getTokenVersion() != tokenProvider.getTokenVersion(claims)) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            attributes.put(ATTR_USER_ID, userId);
            attributes.put(ATTR_ROLE, principal.getUser().getRole().name());
            log.debug("[WEBSOCKET] 인증 성공 userId={} role={}", userId, principal.getUser().getRole());
            return true;
        } catch (RuntimeException exception) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            log.debug("[WEBSOCKET] 인증 실패 reason={}", exception.getClass().getSimpleName());
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // no-op
    }
}
