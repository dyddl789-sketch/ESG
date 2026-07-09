package com.esg.platform.domain.auth.service;

import java.util.Locale;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AccountStatusException;
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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final RedisTokenService redisTokenService;
    private final LoginAttemptService loginAttemptService;
    private final OAuthLoginCodeService oAuthLoginCodeService;

    @Transactional
    public IssuedAuthSession login(LoginRequest request, String clientIp) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        loginAttemptService.assertNotBlocked(email, clientIp);

        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
            EsgUserPrincipal principal = (EsgUserPrincipal) authentication.getPrincipal();
            loginAttemptService.clear(email, clientIp);
            userService.updateLastLogin(principal.getUser().getId());
            return issueSession(userService.getRequiredById(principal.getUser().getId()));
        } catch (AccountStatusException exception) {
            throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);
        } catch (BadCredentialsException exception) {
            loginAttemptService.recordFailure(email, clientIp);
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    @Transactional
    public IssuedAuthSession signup(SignupRequest request) {
        User user = userService.signup(request);
        return issueSession(user);
    }

    public IssuedAuthSession exchangeOAuthCode(String code) {
        Long userId = oAuthLoginCodeService.consume(code);
        return issueSession(userService.getRequiredById(userId));
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
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        // Refresh Token Rotation: 사용한 토큰을 즉시 폐기하고 새 토큰 쌍을 발급합니다.
        redisTokenService.deleteRefreshToken(userId, tokenId);
        return issueSession(user);
    }

    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && !accessToken.isBlank()) {
            try {
                Claims accessClaims = tokenProvider.parseExpected(accessToken, JwtTokenType.ACCESS);
                redisTokenService.blacklistAccessToken(
                        tokenProvider.getJti(accessClaims),
                        tokenProvider.getRemainingTtl(accessClaims)
                );
            } catch (BusinessException ignored) {
                // 이미 만료된 Access Token이어도 로그아웃은 성공 처리합니다.
            }
        }

        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                Claims refreshClaims = tokenProvider.parseExpected(refreshToken, JwtTokenType.REFRESH);
                redisTokenService.deleteRefreshToken(
                        tokenProvider.getUserId(refreshClaims),
                        tokenProvider.getJti(refreshClaims)
                );
            } catch (BusinessException ignored) {
                // 이미 만료되거나 폐기된 Refresh Token이어도 쿠키는 제거합니다.
            }
        }
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
}
