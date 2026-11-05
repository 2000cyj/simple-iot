package com.github.dingdaoyi.iot.model;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

/**
 * 指令响应模型
 *
 * @author dwx
 */
@Data
public class CommandResponse{


   private Map<String, Object> resultData = new HashMap<>();
}
