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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

import com.esg.platform.domain.auth.dto.AuthConfigResponse;
import com.esg.platform.domain.auth.dto.AuthSessionResponse;
import com.esg.platform.domain.auth.dto.AvailabilityResponse;
import com.esg.platform.domain.auth.dto.EmailVerificationConfirmRequest;
import com.esg.platform.domain.auth.dto.EmailVerificationResponse;
import com.esg.platform.domain.auth.dto.EmailVerificationSendRequest;
import com.esg.platform.domain.auth.dto.LoginRequest;
import com.esg.platform.domain.auth.dto.OAuthCodeExchangeRequest;
import com.esg.platform.domain.auth.dto.SignupRequest;
import com.esg.platform.domain.auth.service.AuthService;
import com.esg.platform.domain.auth.service.EmailVerificationService;
import com.esg.platform.domain.auth.service.IssuedAuthSession;
import com.esg.platform.domain.member.dto.UserResponse;
import com.esg.platform.domain.member.service.UserService;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;
import com.esg.platform.global.security.RefreshCookieService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final EmailVerificationService emailVerificationService;
    private final RefreshCookieService refreshCookieService;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:change-me}")
    private String kakaoClientId;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse
    ) {
        log.info("[AUTH] 로그인 요청 loginId={} ip={}", request.loginId(), clientIp(servletRequest));
        IssuedAuthSession issued = authService.login(request, clientIp(servletRequest));
        writeRefreshCookie(servletResponse, issued);
        return ResponseEntity.ok(ApiResponse.ok(issued.response()));
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthSessionResponse>> signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletResponse response
    ) {
        log.info("[AUTH] 회원가입 요청 loginId={} email={}", request.loginId(), maskEmail(request.email()));
        IssuedAuthSession issued = authService.signup(request);
        writeRefreshCookie(response, issued);
        return ResponseEntity.ok(ApiResponse.ok(issued.response()));
    }

    @GetMapping("/check-login-id")
    public ResponseEntity<ApiResponse<AvailabilityResponse>> checkLoginId(
            @RequestParam(name = "loginId") String loginId
    ) {
        boolean available = userService.isLoginIdAvailable(loginId);
        log.debug("[AUTH] 아이디 중복 확인 loginId={} available={}", loginId, available);
        return ResponseEntity.ok(ApiResponse.ok(new AvailabilityResponse(
                available,
                available ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다."
        )));
    }

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<AvailabilityResponse>> checkEmail(
            @RequestParam(name = "email") String email
    ) {
        boolean available = userService.isEmailAvailable(email);
        log.debug("[AUTH] 이메일 중복 확인 email={} available={}", maskEmail(email), available);
        return ResponseEntity.ok(ApiResponse.ok(new AvailabilityResponse(
                available,
                available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다."
        )));
    }

    @GetMapping("/check-phone")
    public ResponseEntity<ApiResponse<AvailabilityResponse>> checkPhone(
            @RequestParam(name = "phoneNumber") String phoneNumber
    ) {
        boolean available = userService.isPhoneAvailable(phoneNumber);
        log.debug("[AUTH] 휴대폰 중복 확인 phone={} available={}", maskPhone(phoneNumber), available);
        return ResponseEntity.ok(ApiResponse.ok(new AvailabilityResponse(
                available,
                available ? "사용 가능한 휴대폰 번호입니다." : "이미 사용 중인 휴대폰 번호입니다."
        )));
    }

    @PostMapping("/email-verifications/send")
    public ResponseEntity<ApiResponse<EmailVerificationResponse>> sendEmailVerification(
            @Valid @RequestBody EmailVerificationSendRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(emailVerificationService.send(request.email())));
    }

    @PostMapping("/email-verifications/confirm")
    public ResponseEntity<ApiResponse<EmailVerificationResponse>> confirmEmailVerification(
            @Valid @RequestBody EmailVerificationConfirmRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                emailVerificationService.confirm(request.email(), request.code())
        ));
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

    private String maskEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return "***";
        }
        int at = email.indexOf('@');
        return at <= 1 ? "***" : email.substring(0, 2) + "***" + email.substring(at);
    }

    private String maskPhone(String phoneNumber) {
        if (!StringUtils.hasText(phoneNumber)) {
            return "***";
        }
        String digits = phoneNumber.replaceAll("\\D", "");
        if (digits.length() < 7) {
            return "***";
        }
        return digits.substring(0, 3) + "****" + digits.substring(digits.length() - 4);
    }
}
