package com.example.user.util;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyPair;
import java.util.Base64;

/**
 * 用于生成 RSA 密钥对的工具类（测试用）
 */
public class KeyPairGenerator {
    
    public static void main(String[] args) throws Exception {
        String resourcesPath = "src/main/resources/keys";
        
        // 确保目录存在
        Files.createDirectories(Paths.get(resourcesPath));
        
        // 生成密钥对
        java.security.KeyPairGenerator keyGen = java.security.KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        KeyPair keyPair = keyGen.generateKeyPair();
        
        // 保存私钥
        String privateKeyPEM = "-----BEGIN PRIVATE KEY-----\n" +
                Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(keyPair.getPrivate().getEncoded()) +
                "\n-----END PRIVATE KEY-----";
        try (FileWriter writer = new FileWriter(resourcesPath + "/private.pem")) {
            writer.write(privateKeyPEM);
        }
        
        // 保存公钥
        String publicKeyPEM = "-----BEGIN PUBLIC KEY-----\n" +
                Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(keyPair.getPublic().getEncoded()) +
                "\n-----END PUBLIC KEY-----";
        try (FileWriter writer = new FileWriter(resourcesPath + "/public.pem")) {
            writer.write(publicKeyPEM);
        }
        
        System.out.println("密钥对已生成到: " + resourcesPath);
    }
}
