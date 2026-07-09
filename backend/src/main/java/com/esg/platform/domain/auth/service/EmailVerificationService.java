package com.esg.platform.domain.auth.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.esg.platform.domain.auth.dto.EmailVerificationResponse;
import com.esg.platform.domain.member.mapper.UserMapper;
import com.esg.platform.global.config.AppProperties;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.esg.platform.global.security.TokenHashUtil;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final String CODE_PREFIX = "auth:email-verification:code:";
    private static final String VERIFIED_PREFIX = "auth:email-verification:verified:";
    private static final String COOLDOWN_PREFIX = "auth:email-verification:cooldown:";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;
    private final UserMapper userMapper;
    private final AppProperties properties;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @PostConstruct
    void configureAndLogMailMode() {
        String originalUsername = mailUsername;
        String originalPassword = mailPassword;

        mailUsername = normalizeCredential(mailUsername, false);
        mailPassword = normalizeCredential(mailPassword, true);

        // Google 앱 비밀번호를 복사할 때 포함될 수 있는 공백과 STS 앞뒤 공백을 제거한 값을
        // 실제 JavaMailSender에도 다시 적용한다.
        if (mailSender instanceof JavaMailSenderImpl sender) {
            sender.setHost(mailHost);
            sender.setPort(mailPort);
            sender.setUsername(mailUsername);
            sender.setPassword(mailPassword);
        }

        boolean usernameChanged = !safe(originalUsername).equals(mailUsername);
        boolean passwordChanged = !safe(originalPassword).equals(mailPassword);

        if (isSmtpConfigured()) {
            log.info("[EMAIL_VERIFY] SMTP 설정 확인 host={} port={} username={} passwordLength={} "
                            + "usernameWhitespaceRemoved={} passwordWhitespaceRemoved={}",
                    mailHost,
                    mailPort,
                    maskEmail(mailUsername),
                    mailPassword.length(),
                    usernameChanged,
                    passwordChanged);

            if (mailPassword.length() != 16) {
                log.error("[EMAIL_VERIFY] Google 앱 비밀번호 길이가 16자가 아닙니다. actualLength={}",
                        mailPassword.length());
            }
            return;
        }

        if (properties.auth().emailVerificationDevLogEnabled()) {
            log.warn("[EMAIL_VERIFY][DEV] SMTP 미설정 - 인증번호를 서버 로그에서 확인합니다.");
        } else {
            log.warn("[EMAIL_VERIFY] SMTP 미설정 - 실제 이메일 발송 기능이 비활성 상태입니다.");
        }
    }

    public EmailVerificationResponse send(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        if (userMapper.countByEmail(email) > 0) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        String keySuffix = emailKey(email);
        String cooldownKey = COOLDOWN_PREFIX + keySuffix;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey))) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_TOO_FREQUENT);
        }

        String code = "%06d".formatted(RANDOM.nextInt(1_000_000));
        Duration codeTtl = properties.auth().emailVerificationCodeExpiration();
        Duration cooldownTtl = properties.auth().emailVerificationResendCooldown();

        redisTemplate.opsForValue().set(
                CODE_PREFIX + keySuffix,
                verificationHash(email, code),
                codeTtl
        );
        redisTemplate.opsForValue().set(cooldownKey, "1", cooldownTtl);
        redisTemplate.delete(VERIFIED_PREFIX + keySuffix);

        try {
            if (isSmtpConfigured()) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailUsername);
                message.setTo(email);
                message.setSubject("[EcoFlow ESG] 회원가입 이메일 인증번호");
                message.setText("EcoFlow ESG 회원가입 인증번호는 " + code
                        + " 입니다. " + codeTtl.toMinutes() + "분 안에 입력해 주세요.");
                mailSender.send(message);
                log.info("[EMAIL_VERIFY] 인증번호 메일 발송 완료 from={} to={}",
                        maskEmail(mailUsername), maskEmail(email));
            } else if (properties.auth().emailVerificationDevLogEnabled()) {
                log.warn("[EMAIL_VERIFY][DEV] SMTP 미설정 - 인증번호 확인용 email={} code={} ttl={}s",
                        maskEmail(email), code, codeTtl.toSeconds());
            } else {
                clearPendingVerification(keySuffix, cooldownKey);
                throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
            }
        } catch (MailAuthenticationException exception) {
            clearPendingVerification(keySuffix, cooldownKey);
            log.error("[EMAIL_VERIFY] Gmail SMTP 인증 거부(535). 앱 비밀번호를 만든 Google 계정과 "
                            + "MAIL_USERNAME이 같은지 확인하세요. username={} passwordLength={} host={} port={}",
                    maskEmail(mailUsername), mailPassword.length(), mailHost, mailPort, exception);
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
        } catch (MailException exception) {
            clearPendingVerification(keySuffix, cooldownKey);
            log.error("[EMAIL_VERIFY] 이메일 발송 실패 from={} to={} host={} port={}",
                    maskEmail(mailUsername), maskEmail(email), mailHost, mailPort, exception);
            throw new BusinessException(ErrorCode.EMAIL_SEND_FAILED);
        }

        return new EmailVerificationResponse(
                email,
                false,
                codeTtl.toSeconds(),
                "인증번호를 발송했습니다."
        );
    }

    public EmailVerificationResponse confirm(String rawEmail, String code) {
        String email = normalizeEmail(rawEmail);
        String keySuffix = emailKey(email);
        String codeKey = CODE_PREFIX + keySuffix;
        String savedHash = redisTemplate.opsForValue().get(codeKey);

        if (savedHash == null) {
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_EXPIRED);
        }
        if (!TokenHashUtil.constantTimeEquals(savedHash, verificationHash(email, code))) {
            log.warn("[EMAIL_VERIFY] 인증번호 불일치 email={}", maskEmail(email));
            throw new BusinessException(ErrorCode.EMAIL_VERIFICATION_CODE_INVALID);
        }

        Duration verifiedTtl = properties.auth().emailVerificationResultExpiration();
        redisTemplate.delete(codeKey);
        redisTemplate.opsForValue().set(VERIFIED_PREFIX + keySuffix, "1", verifiedTtl);

        log.info("[EMAIL_VERIFY] 이메일 인증 완료 email={} verifiedTtl={}s",
                maskEmail(email), verifiedTtl.toSeconds());

        return new EmailVerificationResponse(
                email,
                true,
                verifiedTtl.toSeconds(),
                "이메일 인증이 완료되었습니다."
        );
    }

    public void assertVerified(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        if (!Boolean.TRUE.equals(redisTemplate.hasKey(VERIFIED_PREFIX + emailKey(email)))) {
            throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED);
        }
    }

    public void consumeVerification(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        String keySuffix = emailKey(email);
        redisTemplate.delete(VERIFIED_PREFIX + keySuffix);
        redisTemplate.delete(CODE_PREFIX + keySuffix);
        redisTemplate.delete(COOLDOWN_PREFIX + keySuffix);
    }

    private boolean isSmtpConfigured() {
        return StringUtils.hasText(mailUsername) && StringUtils.hasText(mailPassword);
    }

    private void clearPendingVerification(String keySuffix, String cooldownKey) {
        redisTemplate.delete(CODE_PREFIX + keySuffix);
        redisTemplate.delete(cooldownKey);
    }

    private String normalizeCredential(String value, boolean removeAllWhitespace) {
        String normalized = safe(value).trim();
        return removeAllWhitespace ? normalized.replaceAll("\\s+", "") : normalized;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String emailKey(String email) {
        return TokenHashUtil.sha256(email);
    }

    private String verificationHash(String email, String code) {
        return TokenHashUtil.sha256(email + ":" + code);
    }

    private String maskEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return "(empty)";
        }
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***";
        }
        return email.substring(0, 2) + "***" + email.substring(at);
    }
}
