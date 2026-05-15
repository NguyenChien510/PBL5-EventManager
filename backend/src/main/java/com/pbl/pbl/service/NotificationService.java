package com.pbl.pbl.service;

import com.pbl.pbl.entity.Notification;
import com.pbl.pbl.entity.User;
import com.pbl.pbl.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public Notification createNotification(String message) {
        return createNotification(message, null);
    }

    public Notification createNotification(String message, User user) {
        Notification notification = Notification.builder()
                .message(message)
                .user(user)
                .createdAt(LocalDateTime.now())
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findByUserIsNullOrderByCreatedAtDesc();
    }

    public List<Notification> getNotificationsForUser(User user) {
        return notificationRepository.findByUserOrUserIsNullOrderByCreatedAtDesc(user);
    }

    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByUserOrUserIsNullOrderByCreatedAtDesc(user)
                .stream()
                .filter(n -> !n.getRead())
                .toList();
        if (!unread.isEmpty()) {
            unread.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(unread);
        }
    }
}
