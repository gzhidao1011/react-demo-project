package com.example.chat.mapper;

import com.example.chat.entity.Message;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * 消息数据访问层（MyBatis Mapper）
 */
@Mapper
public interface MessageMapper {

    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    int insert(Message message);

    int deleteByConversationId(String conversationId);
}
