package com.example.Backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic"); // Prefix for messages FROM server TO client
        config.setApplicationDestinationPrefixes("/app"); // Prefix for messages FROM client TO server
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow connections from any origin
                .withSockJS(); // Enable SockJS fallback options
                
        // Also add a plain WebSocket endpoint without SockJS for clients that support it
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }
}