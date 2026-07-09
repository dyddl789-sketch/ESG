package com.esg.platform.domain.auth.oauth;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.member.entity.SocialProvider;
import com.esg.platform.domain.member.entity.User;
import com.esg.platform.domain.member.entity.UserRole;
import com.esg.platform.domain.member.mapper.UserMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KakaoOAuth2UserService extends DefaultOAuth2UserService {

    private final UserMapper userMapper;

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        if (!"kakao".equals(userRequest.getClientRegistration().getRegistrationId())) {
            throw oauthError("unsupported_provider");
        }

        OAuth2User oauth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oauth2User.getAttributes();
        String socialId = String.valueOf(attributes.get("id"));

        Map<String, Object> account = attributes.get("kakao_account") instanceof Map<?, ?> raw
                ? (Map<String, Object>) raw
                : Map.of();
        Map<String, Object> profile = account.get("profile") instanceof Map<?, ?> raw
                ? (Map<String, Object>) raw
                : Map.of();

        String nickname = valueOrDefault(profile.get("nickname"), "카카오 사용자");
        String profileImageUrl = valueOrNull(profile.get("profile_image_url"));
        String email = valueOrNull(account.get("email"));
        boolean verifiedEmail = Boolean.TRUE.equals(account.get("is_email_valid"))
                && Boolean.TRUE.equals(account.get("is_email_verified"));

        if (email == null || !verifiedEmail) {
            email = "kakao_" + socialId + "@oauth.local";
        }
        email = email.toLowerCase(Locale.ROOT);

        User user = userMapper.findBySocial(SocialProvider.KAKAO.name(), socialId);
        if (user == null && verifiedEmail) {
            User emailUser = userMapper.findByEmail(email);
            if (emailUser != null) {
                userMapper.linkSocialAccount(
                        emailUser.getId(),
                        SocialProvider.KAKAO.name(),
                        socialId,
                        profileImageUrl
                );
                user = userMapper.findById(emailUser.getId());
            }
        }

        if (user == null) {
            User newUser = User.builder()
                    .loginId(email)
                    .email(email)
                    .name(nickname)
                    .role(UserRole.EXTERNAL_USER)
                    .socialProvider(SocialProvider.KAKAO)
                    .socialId(socialId)
                    .profileImageUrl(profileImageUrl)
                    .emailVerified(verifiedEmail)
                    .emailVerifiedAt(verifiedEmail ? OffsetDateTime.now() : null)
                    .active(true)
                    .tokenVersion(0)
                    .build();
            userMapper.insertSocialUser(newUser);
            user = userMapper.findById(newUser.getId());
        }

        if (!user.isActive()) {
            throw oauthError("account_disabled");
        }

        userMapper.updateLastLogin(user.getId());
        user = userMapper.findById(user.getId());

        return new EsgOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                attributes,
                "id",
                user
        );
    }

    private OAuth2AuthenticationException oauthError(String code) {
        return new OAuth2AuthenticationException(new OAuth2Error(code));
    }

    private String valueOrDefault(Object value, String defaultValue) {
        String converted = valueOrNull(value);
        return converted == null ? defaultValue : converted;
    }

    private String valueOrNull(Object value) {
        if (value == null) {
            return null;
        }
        String converted = String.valueOf(value).trim();
        return converted.isEmpty() ? null : converted;
    }
}
