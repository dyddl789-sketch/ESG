package com.esg.platform.global.realtime;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.esg.platform.global.config.AppProperties;


@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final EsgWebSocketHandler handler;
    private final JwtWebSocketHandshakeInterceptor handshakeInterceptor;
    private final AppProperties properties;

    public WebSocketConfig(
            EsgWebSocketHandler handler,
            JwtWebSocketHandshakeInterceptor handshakeInterceptor,
            AppProperties properties) {
        this.handler = handler;
        this.handshakeInterceptor = handshakeInterceptor;
        this.properties = properties;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws/esg")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOrigins(properties.cors().allowedOrigins().toArray(String[]::new));
    }
}
