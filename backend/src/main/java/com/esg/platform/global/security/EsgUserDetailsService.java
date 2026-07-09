package com.esg.platform.global.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.esg.platform.domain.member.entity.User;
import com.esg.platform.domain.member.mapper.UserMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EsgUserDetailsService implements UserDetailsService {

    private final UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {
        User user = userMapper.findByLoginId(loginId);
        if (user == null || user.getPasswordHash() == null) {
            log.debug("[SECURITY] 로컬 로그인 사용자 조회 실패 loginId={}", loginId);
            throw new UsernameNotFoundException("사용자를 찾을 수 없습니다.");
        }
        return new EsgUserPrincipal(user);
    }

    public EsgUserPrincipal loadById(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new UsernameNotFoundException("사용자를 찾을 수 없습니다.");
        }
        return new EsgUserPrincipal(user);
    }
}
