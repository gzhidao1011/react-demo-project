package com.example.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * JWT 服务：生成与解析 Access/Refresh Token（auth-service 签发）
 */
@Service
public class JwtService {

    @Value("${jwt.private-key-path}")
    private Resource privateKeyResource;

    @Value("${jwt.public-key-path}")
    private Resource publicKeyResource;

    @Value("${jwt.access-token-expiration:1800}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration:604800}")
    private long refreshTokenExpiration;

    @Value("${jwt.issuer:https://auth.example.com}")
    private String issuer;

    @Value("${jwt.audience:api.example.com}")
    private String audience;

    public String generateAccessToken(String userId, String username, List<String> roles) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiration * 1000);
        Map<String, Object> claims = new HashMap<>();
        claims.put("username", username);
        if (roles != null) {
            claims.put("roles", roles);
        }
        claims.put("type", "access");
        return Jwts.builder()
                .claims(claims)
                .subject(userId)
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(now)
                .expiration(expiry)
                .signWith(loadPrivateKey())
                .compact();
    }

    public String generateRefreshToken(String userId, String deviceId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenExpiration * 1000);
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        claims.put("jti", UUID.randomUUID().toString());
        if (deviceId != null) {
            claims.put("deviceId", deviceId);
        }
        return Jwts.builder()
                .claims(claims)
                .subject(userId)
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(now)
                .expiration(expiry)
                .signWith(loadPrivateKey())
                .compact();
    }

    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(loadPublicKey())
                    .requireIssuer(issuer)
                    .requireAudience(audience)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new ExpiredJwtException(e.getHeader(), e.getClaims(), "Token 已过期");
        } catch (JwtException e) {
            throw new JwtException("无效的 Token: " + e.getMessage());
        }
    }

    public boolean isTokenExpiringSoon(String token) {
        try {
            Claims claims = parseToken(token);
            long remaining = claims.getExpiration().getTime() - System.currentTimeMillis();
            return remaining < 5 * 60 * 1000;
        } catch (Exception e) {
            return true;
        }
    }

    private PrivateKey loadPrivateKey() {
        try (InputStream is = privateKeyResource.getInputStream()) {
            String content = new String(is.readAllBytes())
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decoded = java.util.Base64.getDecoder().decode(content);
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(decoded));
        } catch (Exception e) {
            throw new RuntimeException("加载私钥失败", e);
        }
    }

    private PublicKey loadPublicKey() {
        try (InputStream is = publicKeyResource.getInputStream()) {
            String content = new String(is.readAllBytes())
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decoded = java.util.Base64.getDecoder().decode(content);
            return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(decoded));
        } catch (Exception e) {
            throw new RuntimeException("加载公钥失败", e);
        }
    }
}
