package com.esg.platform.domain.auth.oauth;

import java.util.Collection;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

import com.esg.platform.domain.member.entity.User;

import lombok.Getter;

@Getter
public class EsgOAuth2User extends DefaultOAuth2User {

    private static final long serialVersionUID = 1L;
    private final User user;

    public EsgOAuth2User(
            Collection<? extends GrantedAuthority> authorities,
            Map<String, Object> attributes,
            String nameAttributeKey,
            User user
    ) {
        super(authorities, attributes, nameAttributeKey);
        this.user = user;
    }
}
