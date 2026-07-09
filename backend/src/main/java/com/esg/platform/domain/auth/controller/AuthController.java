package com.esg.platform.domain.auth.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

import com.esg.platform.domain.auth.dto.AuthConfigResponse;
import com.esg.platform.domain.auth.dto.AuthSessionResponse;
import com.esg.platform.domain.auth.dto.LoginRequest;
import com.esg.platform.domain.auth.dto.OAuthCodeExchangeRequest;
import com.esg.platform.domain.auth.dto.SignupRequest;
import com.esg.platform.domain.auth.service.AuthService;
import com.esg.platform.domain.auth.service.IssuedAuthSession;
import com.esg.platform.domain.member.dto.UserResponse;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;
import com.esg.platform.global.security.RefreshCookieService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshCookieService refreshCookieService;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:change-me}")
    private String kakaoClientId;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse
    ) {
        IssuedAuthSession issued = authService.login(request, clientIp(servletRequest));
        writeRefreshCookie(servletResponse, issued);
        return ResponseEntity.ok(ApiResponse.ok(issued.response()));
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletResponse response
    ) {
        IssuedAuthSession issued = authService.signup(request);
        writeRefreshCookie(response, issued);
        return ResponseEntity.ok(ApiResponse.ok(issued.response()));
    }

    @PostMapping("/oauth/exchange")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> exchangeOAuthCode(
            @Valid @RequestBody OAuthCodeExchangeRequest request,
            HttpServletResponse response
    ) {
        IssuedAuthSession issued = authService.exchangeOAuthCode(request.code());
        writeRefreshCookie(response, issued);
        return ResponseEntity.ok(ApiResponse.ok(issued.response()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        IssuedAuthSession issued = authService.refresh(readRefreshCookie(request));
        writeRefreshCookie(response, issued);
        return ResponseEntity.ok(ApiResponse.ok(issued.response()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        authService.logout(resolveBearer(authorization), readRefreshCookie(request));
        refreshCookieService.clear(response);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(
            @AuthenticationPrincipal EsgUserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.ok(authService.me(principal)));
    }

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<AuthConfigResponse>> config() {
        boolean kakaoEnabled = StringUtils.hasText(kakaoClientId) && !"change-me".equals(kakaoClientId);
        return ResponseEntity.ok(ApiResponse.ok(
                new AuthConfigResponse(kakaoEnabled, "/oauth2/authorization/kakao")
        ));
    }

    private void writeRefreshCookie(HttpServletResponse response, IssuedAuthSession issued) {
        refreshCookieService.write(response, issued.refreshToken(), issued.refreshTokenTtl());
    }


    private String readRefreshCookie(HttpServletRequest request) {
        var cookie = WebUtils.getCookie(request, refreshCookieService.cookieName());
        return cookie == null ? null : cookie.getValue();
    }

    private String resolveBearer(String authorization) {
        if (StringUtils.hasText(authorization) && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
