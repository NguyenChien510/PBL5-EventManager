package com.pbl.pbl.controller;

import com.pbl.pbl.entity.Notification;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.service.NotificationService;
import com.pbl.pbl.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications() {
        User currentUser = userService.getCurrentUserEntity();
        List<Notification> notifications = notificationService.getNotificationsForUser(currentUser);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        User currentUser = userService.getCurrentUserEntity();
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok().build();
    }
}
