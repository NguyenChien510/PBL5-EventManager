package com.pbl.pbl.repository;

import com.pbl.pbl.entity.Notification;
import com.pbl.pbl.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrUserIsNullOrderByCreatedAtDesc(User user);
    List<Notification> findByUserIsNullOrderByCreatedAtDesc();
}
