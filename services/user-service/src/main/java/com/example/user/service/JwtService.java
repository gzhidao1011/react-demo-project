package com.example.user.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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

/**
 * JWT 服务类
 * 负责生成和解析 JWT Token
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
    
    /**
     * 生成 Access Token
     * 
     * @param userId 用户ID
     * @param username 用户名
     * @param roles 用户角色列表
     * @return Access Token 字符串
     */
    public String generateAccessToken(String userId, String username, List<String> roles) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration * 1000);
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("username", username);
        if (roles != null) {
            claims.put("roles", roles);
        }
        claims.put("type", "access");
        
        return Jwts.builder()
                .claims(claims)
                .subject(userId)  // sub claim
                .issuer(issuer)   // iss claim
                .audience().add(audience).and() // aud claim
                .issuedAt(now)     // iat claim
                .expiration(expiryDate) // exp claim
                .signWith(getPrivateKey())
                .compact();
    }
    
    /**
     * 生成 Refresh Token
     * 
     * @param userId 用户ID
     * @param deviceId 设备ID（可选）
     * @return Refresh Token 字符串
     */
    public String generateRefreshToken(String userId, String deviceId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpiration * 1000);
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        if (deviceId != null) {
            claims.put("deviceId", deviceId);
        }
        
        return Jwts.builder()
                .claims(claims)
                .subject(userId)
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getPrivateKey())
                .compact();
    }
    
    /**
     * 解析和验证 Token
     * 
     * @param token JWT Token 字符串
     * @return Claims 对象，包含 Token 中的所有声明
     * @throws ExpiredJwtException Token 已过期
     * @throws JwtException Token 无效
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
            throw new ExpiredJwtException(e.getHeader(), e.getClaims(), "Token 已过期");
        } catch (JwtException e) {
            throw new JwtException("无效的 Token: " + e.getMessage());
        }
    }
    
    /**
     * 从资源文件加载私钥
     * 使用 InputStream 读取，支持 jar 包环境
     */
    private PrivateKey getPrivateKey() {
        try (InputStream inputStream = privateKeyResource.getInputStream()) {
            byte[] keyBytes = inputStream.readAllBytes();
            
            // 移除 PEM 格式的头部和尾部
            String keyContent = new String(keyBytes);
            keyContent = keyContent.replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            
            byte[] decodedKey = java.util.Base64.getDecoder().decode(keyContent);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decodedKey);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            return kf.generatePrivate(spec);
        } catch (Exception e) {
            throw new RuntimeException("加载私钥失败", e);
        }
    }
    
    /**
     * 从资源文件加载公钥
     * 使用 InputStream 读取，支持 jar 包环境
     */
    private PublicKey getPublicKey() {
        try (InputStream inputStream = publicKeyResource.getInputStream()) {
            byte[] keyBytes = inputStream.readAllBytes();
            
            // 移除 PEM 格式的头部和尾部
            String keyContent = new String(keyBytes);
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
    
    /**
     * 检查 Token 是否即将过期（剩余时间 < 5 分钟）
     * 
     * @param token JWT Token 字符串
     * @return true 如果 Token 即将过期或已过期，false 否则
     */
    public boolean isTokenExpiringSoon(String token) {
        try {
            Claims claims = parseToken(token);
            Date expiration = claims.getExpiration();
            long remainingTime = expiration.getTime() - System.currentTimeMillis();
            return remainingTime < 5 * 60 * 1000; // 5 分钟
        } catch (Exception e) {
            return true; // 如果解析失败，认为已过期
        }
    }
}
