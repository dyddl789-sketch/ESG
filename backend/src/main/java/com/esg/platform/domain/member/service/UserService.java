package com.esg.platform.domain.member.service;

import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.auth.dto.SignupRequest;
import com.esg.platform.domain.member.entity.SocialProvider;
import com.esg.platform.domain.member.entity.User;
import com.esg.platform.domain.member.entity.UserRole;
import com.esg.platform.domain.member.mapper.UserMapper;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public User getRequiredById(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return user;
    }

    public User getRequiredByEmail(String email) {
        User user = userMapper.findByEmail(normalizeEmail(email));
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return user;
    }

    @Transactional
    public User signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        if (userMapper.countByEmail(email) > 0) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .loginId(email)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .name(request.name().trim())
                .role(UserRole.EXTERNAL_USER)
                .phoneNumber(normalizeBlank(request.phoneNumber()))
                .socialProvider(SocialProvider.LOCAL)
                .active(true)
                .tokenVersion(0)
                .build();

        try {
            userMapper.insertLocalUser(user);
        } catch (DataIntegrityViolationException exception) {
            // 사전 중복 검사와 INSERT 사이의 경쟁 조건도 DB UNIQUE 제약으로 최종 차단합니다.
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        return getRequiredById(user.getId());
    }

    public void updateLastLogin(Long userId) {
        userMapper.updateLastLogin(userId);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
