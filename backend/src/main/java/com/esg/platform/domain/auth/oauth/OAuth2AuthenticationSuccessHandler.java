package com.esg.platform.domain.auth.oauth;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
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
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final OAuthLoginCodeService codeService;
    private final AppProperties properties;
    private final OAuthAuthorizationRequestCookieRepository authorizationRequestRepository;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        EsgOAuth2User principal = (EsgOAuth2User) authentication.getPrincipal();
        String oneTimeCode = codeService.create(principal.getUser().getId());
        authorizationRequestRepository.deleteCookie(response);

        String redirectUrl = UriComponentsBuilder
                .fromUriString(properties.frontendUrl() + "/oauth/callback")
                .queryParam("code", oneTimeCode)
                .build(true)
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
