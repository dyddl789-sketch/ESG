package com.esg.platform.global.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.esg.platform.global.exception.BusinessException;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final RedisTokenService redisTokenService;
    private final EsgUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String token = resolveBearerToken(request);

        if (StringUtils.hasText(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = tokenProvider.parseExpected(token, JwtTokenType.ACCESS);
                String jti = tokenProvider.getJti(claims);
                Long userId = tokenProvider.getUserId(claims);

                if (redisTokenService.isBlacklisted(jti)) {
                    log.debug("[JWT_FILTER] 블랙리스트 토큰 차단 userId={} jti={} path={}",
                            userId, jti, request.getRequestURI());
                } else {
                    EsgUserPrincipal principal = userDetailsService.loadById(userId);
                    if (principal.getUser().getTokenVersion() == tokenProvider.getTokenVersion(claims)
                            && principal.isEnabled()) {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        principal,
                                        null,
                                        principal.getAuthorities()
                                );
                        authentication.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request)
                        );
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        log.debug("[JWT_FILTER] 인증 성공 userId={} loginId={} role={} jti={} path={}",
                                userId,
                                principal.getUser().getLoginId(),
                                principal.getUser().getRole(),
                                jti,
                                request.getRequestURI());
                    } else {
                        log.debug("[JWT_FILTER] 토큰 버전/계정 상태 불일치 userId={} jti={}", userId, jti);
                    }
                }
            } catch (BusinessException exception) {
                SecurityContextHolder.clearContext();
                log.debug("[JWT_FILTER] 인증 실패 path={} reason={}",
                        request.getRequestURI(), exception.getErrorCode().getCode());
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveBearerToken(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (StringUtils.hasText(authorization) && authorization.startsWith("Bearer ")) {
            return authorization.substring(7);
        }
        return null;
    }
}
