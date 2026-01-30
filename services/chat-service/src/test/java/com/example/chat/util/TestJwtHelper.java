package com.example.chat.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 测试用 JWT 生成工具
 * 使用与 user-service 相同的密钥对生成有效 Access Token
 */
public final class TestJwtHelper {

    private static final String ISSUER = "https://auth.example.com";
    private static final String AUDIENCE = "api.example.com";
    private static final long EXPIRATION_SECONDS = 1800;

    private TestJwtHelper() {
    }

    /**
     * 生成 Access Token（用于测试）
     */
    public static String generateAccessToken(String userId, String username, List<String> roles) {
        return generateAccessTokenWithExpiry(userId, username, roles, EXPIRATION_SECONDS);
    }

    /**
     * 生成已过期的 Access Token（用于测试 Token 过期场景）
     */
    public static String generateExpiredAccessToken(String userId, String username, List<String> roles) {
        return generateAccessTokenWithExpiry(userId, username, roles, -60);
    }

    private static String generateAccessTokenWithExpiry(String userId, String username, List<String> roles,
                                                        long expirationSeconds) {
        try {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + expirationSeconds * 1000);

            Map<String, Object> claims = new HashMap<>();
            claims.put("username", username);
            if (roles != null) {
                claims.put("roles", roles);
            }
            claims.put("type", "access");

            return Jwts.builder()
                    .claims(claims)
                    .subject(userId)
                    .issuer(ISSUER)
                    .audience().add(AUDIENCE).and()
                    .issuedAt(now)
                    .expiration(expiryDate)
                    .signWith(loadPrivateKey())
                    .compact();
        } catch (Exception e) {
            throw new RuntimeException("生成测试 Token 失败", e);
        }
    }

    private static PrivateKey loadPrivateKey() throws Exception {
        try (InputStream is = new ClassPathResource("keys/private.pem").getInputStream()) {
            String keyContent = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            keyContent = keyContent.replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decodedKey = java.util.Base64.getDecoder().decode(keyContent);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decodedKey);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            return kf.generatePrivate(spec);
        }
    }
}
