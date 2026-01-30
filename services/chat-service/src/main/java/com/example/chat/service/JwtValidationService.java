package com.example.chat.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Collections;
import java.util.List;

/**
 * JWT 验证服务
 * 仅验证 Access Token，不生成 Token
 */
@Service
public class JwtValidationService {

    @Value("${jwt.public-key-path}")
    private Resource publicKeyResource;

    @Value("${jwt.issuer:https://auth.example.com}")
    private String issuer;

    @Value("${jwt.audience:api.example.com}")
    private String audience;

    /**
     * 解析并验证 Token
     *
     * @param token Bearer Token 字符串
     * @return Claims，包含 sub（userId）、username 等
     */
    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getPublicKey())
                    .requireIssuer(issuer)
                    .requireAudience(audience)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new JwtException("Token 已过期");
        } catch (JwtException e) {
            throw new JwtException("无效的 Token: " + e.getMessage());
        }
    }

    /**
     * 从 Token 提取用户 ID（subject）
     */
    public String extractUserId(String token) {
        Claims claims = parseToken(token);
        return claims.getSubject();
    }

    private PublicKey getPublicKey() {
        try (InputStream is = publicKeyResource.getInputStream()) {
            String keyContent = new String(is.readAllBytes());
            keyContent = keyContent.replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decodedKey = java.util.Base64.getDecoder().decode(keyContent);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(decodedKey);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            return kf.generatePublic(spec);
        } catch (Exception e) {
            throw new RuntimeException("加载公钥失败", e);
        }
    }
}
