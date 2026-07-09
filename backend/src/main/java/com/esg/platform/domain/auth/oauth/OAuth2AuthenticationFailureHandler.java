package com.esg.platform.domain.auth.oauth;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.esg.platform.global.config.AppProperties;
import com.esg.platform.global.security.OAuthAuthorizationRequestCookieRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final AppProperties properties;
    private final OAuthAuthorizationRequestCookieRepository authorizationRequestRepository;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        authorizationRequestRepository.deleteCookie(response);
        String redirectUrl = UriComponentsBuilder
                .fromUriString(properties.frontendUrl() + "/login")
                .queryParam("oauthError", "kakao_login_failed")
                .build(true)
                .toUriString();
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
