package com.esg.platform.domain.auth.service;

import java.util.Locale;

import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.auth.dto.AuthSessionResponse;
import com.esg.platform.domain.auth.dto.LoginRequest;
import com.esg.platform.domain.auth.dto.SignupRequest;
import com.esg.platform.domain.auth.oauth.OAuthLoginCodeService;
import com.esg.platform.domain.member.dto.UserResponse;
import com.esg.platform.domain.member.entity.User;
import com.esg.platform.domain.member.service.UserService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.esg.platform.global.security.EsgUserPrincipal;
import com.esg.platform.global.security.JwtTokenPair;
import com.esg.platform.global.security.JwtTokenProvider;
import com.esg.platform.global.security.JwtTokenType;
import com.esg.platform.global.security.LoginAttemptService;
import com.esg.platform.global.security.RedisTokenService;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final RedisTokenService redisTokenService;
    private final LoginAttemptService loginAttemptService;
    private final OAuthLoginCodeService oAuthLoginCodeService;
    private final EmailVerificationService emailVerificationService;

    @Transactional
    public IssuedAuthSession login(LoginRequest request, String clientIp) {
        String loginId = normalizeLoginId(request.loginId());
        loginAttemptService.assertNotBlocked(loginId, clientIp);

        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginId, request.password())
            );
            EsgUserPrincipal principal = (EsgUserPrincipal) authentication.getPrincipal();
            loginAttemptService.clear(loginId, clientIp);
            userService.updateLastLogin(principal.getUser().getId());

            User user = userService.getRequiredById(principal.getUser().getId());
            log.info("[AUTH] 로그인 성공 userId={} loginId={} role={} ip={}",
                    user.getId(), user.getLoginId(), user.getRole(), clientIp);
            return issueSession(user);
        } catch (AccountStatusException exception) {
            log.warn("[AUTH] 비활성 계정 로그인 차단 loginId={} ip={}", loginId, clientIp);
            throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);
        } catch (BadCredentialsException exception) {
            loginAttemptService.recordFailure(loginId, clientIp);
            log.warn("[AUTH] 로그인 실패 loginId={} ip={}", loginId, clientIp);
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    @Transactional
    public IssuedAuthSession signup(SignupRequest request) {
        emailVerificationService.assertVerified(request.email());
        User user = userService.signup(request);
        IssuedAuthSession issued = issueSession(user);
        emailVerificationService.consumeVerification(request.email());
        log.info("[AUTH] 회원가입 완료 userId={} loginId={} role={}",
                user.getId(), user.getLoginId(), user.getRole());
        return issued;
    }

    public IssuedAuthSession exchangeOAuthCode(String code) {
        Long userId = oAuthLoginCodeService.consume(code);
        User user = userService.getRequiredById(userId);
        log.info("[AUTH] OAuth 로그인 코드 교환 완료 userId={} role={}", user.getId(), user.getRole());
        return issueSession(user);
    }

    public IssuedAuthSession refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        Claims claims = tokenProvider.parseExpected(refreshToken, JwtTokenType.REFRESH);
        Long userId = tokenProvider.getUserId(claims);
        String tokenId = tokenProvider.getJti(claims);
        redisTokenService.verifyRefreshToken(userId, tokenId, refreshToken);

        User user = userService.getRequiredById(userId);
        if (!user.isActive() || user.getTokenVersion() != tokenProvider.getTokenVersion(claims)) {
            redisTokenService.deleteRefreshToken(userId, tokenId);
            log.warn("[AUTH] Refresh Token 재발급 거부 userId={} jti={}", userId, tokenId);
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        redisTokenService.deleteRefreshToken(userId, tokenId);
        log.debug("[AUTH] Refresh Token rotation userId={} oldJti={}", userId, tokenId);
        return issueSession(user);
    }

    public void logout(String accessToken, String refreshToken) {
        Long logoutUserId = null;

        if (accessToken != null && !accessToken.isBlank()) {
            try {
                Claims accessClaims = tokenProvider.parseExpected(accessToken, JwtTokenType.ACCESS);
                logoutUserId = tokenProvider.getUserId(accessClaims);
                redisTokenService.blacklistAccessToken(
                        tokenProvider.getJti(accessClaims),
                        tokenProvider.getRemainingTtl(accessClaims)
                );
            } catch (BusinessException ignored) {
                log.debug("[AUTH] 로그아웃 시 Access Token이 이미 만료되었거나 유효하지 않습니다.");
            }
        }

        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                Claims refreshClaims = tokenProvider.parseExpected(refreshToken, JwtTokenType.REFRESH);
                logoutUserId = tokenProvider.getUserId(refreshClaims);
                redisTokenService.deleteRefreshToken(
                        tokenProvider.getUserId(refreshClaims),
                        tokenProvider.getJti(refreshClaims)
                );
            } catch (BusinessException ignored) {
                log.debug("[AUTH] 로그아웃 시 Refresh Token이 이미 만료되었거나 폐기되었습니다.");
            }
        }

        log.info("[AUTH] 로그아웃 완료 userId={}", logoutUserId);
    }

    public UserResponse me(EsgUserPrincipal principal) {
        if (principal == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return UserResponse.from(userService.getRequiredById(principal.getUser().getId()));
    }

    private IssuedAuthSession issueSession(User user) {
        JwtTokenPair pair = tokenProvider.createTokenPair(user);
        Claims refreshClaims = tokenProvider.parseExpected(pair.refreshToken(), JwtTokenType.REFRESH);
        redisTokenService.saveRefreshToken(
                user.getId(),
                tokenProvider.getJti(refreshClaims),
                pair.refreshToken(),
                pair.refreshTokenTtl()
        );
        AuthSessionResponse response = new AuthSessionResponse(
                pair.accessToken(),
                pair.accessTokenTtl().toSeconds(),
                UserResponse.from(user)
        );
        return new IssuedAuthSession(response, pair.refreshToken(), pair.refreshTokenTtl());
    }

    private String normalizeLoginId(String loginId) {
        return loginId.trim().toLowerCase(Locale.ROOT);
    }
}
