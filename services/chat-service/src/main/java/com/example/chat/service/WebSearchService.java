package com.example.chat.service;

import java.util.List;

/**
 * 网页搜索服务接口
 * 用于 LLM Function Calling 获取实时互联网信息
 */
public interface WebSearchService {

    /**
     * 执行搜索并返回格式化结果
     *
     * @param query 搜索关键词
     * @return 格式化后的搜索结果文本，供 LLM 参考
     */
    String search(String query);
}
