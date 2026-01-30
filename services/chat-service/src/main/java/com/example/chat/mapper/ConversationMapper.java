package com.example.chat.mapper;

import com.example.chat.entity.Conversation;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 会话数据访问层（MyBatis Mapper）
 */
@Mapper
public interface ConversationMapper {

    Conversation findById(String id);

    List<Conversation> findByUserIdOrderByUpdatedAtDesc(String userId);

    int insert(Conversation conversation);

    int update(Conversation conversation);

    int deleteById(String id);
}
