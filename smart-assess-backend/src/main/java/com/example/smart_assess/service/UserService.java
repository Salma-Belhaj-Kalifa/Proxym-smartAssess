package com.example.smart_assess.service;

import com.example.smart_assess.dto.ChangePasswordRequest;
import com.example.smart_assess.dto.CreateUserRequest;
import com.example.smart_assess.dto.UpdateUserRequest;
import com.example.smart_assess.dto.UserDto;
import com.example.smart_assess.enums.Role;

import java.util.List;

public interface UserService {
    UserDto createUser(CreateUserRequest request);
    UserDto updateUser(Long id, CreateUserRequest request);
    UserDto updateUserProfile(Long id, UpdateUserRequest request);
    void changePassword(Long id, ChangePasswordRequest request);
    void deleteUser(Long id);
    UserDto getUserById(Long id);
    UserDto getUserByEmail(String email);
    List<UserDto> getAllUsers();
    List<UserDto> getUsersByRole(Role role);
}
