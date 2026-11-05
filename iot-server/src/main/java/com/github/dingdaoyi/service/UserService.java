package com.github.dingdaoyi.service;

import com.github.dingdaoyi.entity.User;
import com.baomidou.mybatisplus.extension.service.IService;

import java.util.Optional;

/**
 * 用户服务接口
 *
 * @author dingyunwei
 */
public interface UserService extends IService<User>{

    /**
     * 按用户名查询用户
     * @param username 用户名
     * @return 用户信息
     */
    Optional<User> getByUsername(String username);

    /**
     * 修改密码
     * @param userId 用户id
     * @param oldPassword 原密码
     * @param newPassword 新密码
     * @return 是否修改成功
     */
    boolean changePassword(Integer userId, String oldPassword, String newPassword);
}
