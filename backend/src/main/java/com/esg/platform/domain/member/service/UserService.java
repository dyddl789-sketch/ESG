package com.esg.platform.domain.member.service;

import java.time.OffsetDateTime;
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
import lombok.extern.slf4j.Slf4j;

@Slf4j
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

    public boolean isLoginIdAvailable(String loginId) {
        return userMapper.countByLoginId(normalizeLoginId(loginId)) == 0;
    }

    public boolean isEmailAvailable(String email) {
        return userMapper.countByEmail(normalizeEmail(email)) == 0;
    }

    public boolean isPhoneAvailable(String phoneNumber) {
        return userMapper.countByPhoneNumber(normalizePhone(phoneNumber)) == 0;
    }

    @Transactional
    public User signup(SignupRequest request) {
        String loginId = normalizeLoginId(request.loginId());
        String email = normalizeEmail(request.email());
        String phoneNumber = normalizePhone(request.phoneNumber());

        assertAvailable(loginId, email, phoneNumber);

        User user = User.builder()
                .loginId(loginId)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .name(request.name().trim())
                .role(UserRole.EXTERNAL_USER)
                .phoneNumber(phoneNumber)
                .socialProvider(SocialProvider.LOCAL)
                .emailVerified(true)
                .emailVerifiedAt(OffsetDateTime.now())
                .active(true)
                .tokenVersion(0)
                .build();

        try {
            userMapper.insertLocalUser(user);
        } catch (DataIntegrityViolationException exception) {
            log.warn("[MEMBER] 회원가입 DB 중복 제약 발생 loginId={} email={} phone={}",
                    loginId, maskEmail(email), maskPhone(phoneNumber));
            assertAvailable(loginId, email, phoneNumber);
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        return getRequiredById(user.getId());
    }

    public void updateLastLogin(Long userId) {
        userMapper.updateLastLogin(userId);
        log.debug("[MEMBER] 마지막 로그인 시각 갱신 userId={}", userId);
    }

    private void assertAvailable(String loginId, String email, String phoneNumber) {
        if (userMapper.countByLoginId(loginId) > 0) {
            throw new BusinessException(ErrorCode.LOGIN_ID_ALREADY_EXISTS);
        }
        if (userMapper.countByEmail(email) > 0) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (userMapper.countByPhoneNumber(phoneNumber) > 0) {
            throw new BusinessException(ErrorCode.PHONE_ALREADY_EXISTS);
        }
    }

    private String normalizeLoginId(String loginId) {
        return loginId.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phoneNumber) {
        return phoneNumber.replaceAll("[^0-9]", "");
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        return at <= 1 ? "***" : email.substring(0, 2) + "***" + email.substring(at);
    }

    private String maskPhone(String phone) {
        if (phone.length() < 7) {
            return "***";
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
}
