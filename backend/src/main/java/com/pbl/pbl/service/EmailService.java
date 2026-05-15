package com.pbl.pbl.service;

import java.text.NumberFormat;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.pbl.pbl.entity.Comment;
import com.pbl.pbl.entity.Event;
import com.pbl.pbl.entity.Order;
import com.pbl.pbl.entity.Ticket;
import com.pbl.pbl.entity.User;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final NotificationService notificationService;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Autowired
    public EmailService(JavaMailSender mailSender, NotificationService notificationService) {
        this.mailSender = mailSender;
        this.notificationService = notificationService;
    }

    @Async
    public void sendTicketEmail(Order order) {
        try {
            if (order.getTickets() == null || order.getTickets().isEmpty()) {
                log.warn("Order {} has no tickets. Skipping email.", order.getId());
                return;
            }

            Ticket sample = order.getTickets().get(0);
            Event event = sample.getSeat().getEventSession().getEvent();
            User user = order.getUser();

            String seatNumbers = order.getTickets().stream()
                    .map(t -> t.getSeat().getSeatNumber())
                    .collect(Collectors.joining(", "));

            String sessionName = sample.getSeat().getEventSession().getName();
            String sessionDate = sample.getSeat().getEventSession().getSessionDate().toString();
            String sessionTime = sample.getSeat().getEventSession().getStartTime().toString() + " - " +
                    sample.getSeat().getEventSession().getEndTime().toString();

            NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
            String formattedTotal = currencyFormatter.format(order.getTotalAmount());

            String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + order.getQrCode();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "EventManager Team");
            helper.setTo(user.getEmail());
            helper.setSubject("🎉 Xác nhận đặt vé thành công - " + event.getTitle());

            String content = "<html>" +
                    "<body style='font-family: \"Helvetica Neue\", Arial, sans-serif; line-height: 1.6; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333;'>" +
                    "  <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);'>" +
                    "    <!-- Accent Header -->" +
                    "    <div style='background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 20px; text-align: center; color: white;'>" +
                    "      <h1 style='margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;'>Đặt Vé Thành Công!</h1>" +
                    "      <p style='margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;'>Cảm ơn bạn đã đồng hành cùng EventManager.</p>" +
                    "    </div>" +
                    "    " +
                    "    <div style='padding: 30px;'>" +
                    "      <p style='margin: 0 0 20px 0; font-size: 16px;'>Xin chào <strong>" + user.getFullName() + "</strong>,</p>" +
                    "      <p style='margin: 0 0 25px 0; font-size: 15px; color: #555;'>Bạn đã thanh toán thành công vé cho sự kiện dưới đây. Thông tin chi tiết của bạn đã được hệ thống ghi nhận.</p>" +
                    "      " +
                    "      <!-- Event Detail Card -->" +
                    "      <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;'>" +
                    "        <h3 style='margin: 0 0 15px 0; font-size: 18px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;'>" + event.getTitle() + "</h3>" +
                    "        <table style='width: 100%; border-collapse: collapse; font-size: 14px; color: #475569;'>" +
                    "          <tr><td style='padding: 6px 0; font-weight: 600; width: 100px;'>Suất diễn:</td><td style='padding: 6px 0; color: #0f172a;'>" + (sessionName != null ? sessionName : "Mặc định") + "</td></tr>" +
                    "          <tr><td style='padding: 6px 0; font-weight: 600;'>Thời gian:</td><td style='padding: 6px 0; color: #0f172a;'>" + sessionTime + " (" + sessionDate + ")</td></tr>" +
                    "          <tr><td style='padding: 6px 0; font-weight: 600;'>Địa điểm:</td><td style='padding: 6px 0; color: #0f172a;'>" + event.getLocation() + "</td></tr>" +
                    "          <tr><td style='padding: 6px 0; font-weight: 600;'>Danh sách ghế:</td><td style='padding: 6px 0;'><span style='display: inline-block; background-color: #ecfdf5; color: #065f46; padding: 4px 10px; border-radius: 20px; font-weight: bold;'>" + seatNumbers + "</span></td></tr>" +
                    "          <tr><td style='padding: 6px 0; font-weight: 600;'>Tổng tiền:</td><td style='padding: 6px 0; color: #ef4444; font-weight: 700; font-size: 16px;'>" + formattedTotal + "</td></tr>" +
                    "        </table>" +
                    "      </div>" +
                    "      " +
                    "      <!-- QR Code Section -->" +
                    "      <div style='text-align: center; margin-bottom: 30px;'>" +
                    "        <p style='margin: 0 0 15px 0; font-weight: 600; color: #1e293b; font-size: 15px;'>Mã vé điện tử (QR Code)</p>" +
                    "        <div style='display: inline-block; padding: 15px; background: #fff; border: 2px dashed #cbd5e1; border-radius: 12px;'>" +
                    "          <img src='" + qrUrl + "' alt='Mã QR' style='width: 200px; height: 200px; display: block;' />" +
                    "        </div>" +
                    "        <p style='margin: 15px 0 0 0; font-size: 13px; color: #64748b;'>Vui lòng đưa mã này cho nhân viên soát vé tại địa điểm sự kiện.</p>" +
                    "      </div>" +
                    "      " +
                    "      <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;' />" +
                    "      <div style='text-align: center; font-size: 13px; color: #94a3b8;'>" +
                    "        <p style='margin: 0;'>Đây là email tự động từ hệ thống, vui lòng không trả lời thư này.</p>" +
                    "        <p style='margin: 5px 0 0 0;'>&copy; " + java.time.Year.now().getValue() + " EventManager. Bảo lưu mọi quyền.</p>" +
                    "      </div>" +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(content, true);
            mailSender.send(message);
            
            // Create in-app notification
            notificationService.createNotification("Đặt vé thành công cho sự kiện \"" + event.getTitle() + "\". Hãy kiểm tra chi tiết trong phần vé của bạn!", user);
            
            log.info("Successfully sent ticket confirmation email for order {} to {}", order.getId(), user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send ticket confirmation email for order {}", order.getId(), e);
        }
    }

    @Async
    public void sendEventApprovedEmail(Event event) {
        try {
            User organizer = event.getOrganizer();
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "EventManager Team");
            helper.setTo(organizer.getEmail());
            helper.setSubject("🚀 Sự kiện của bạn đã được phê duyệt thành công!");

            String eventLink = frontendUrl + "/event/" + event.getId();

            String content = "<html>" +
                    "<body style='font-family: \"Helvetica Neue\", Arial, sans-serif; background-color: #f4f6f9; padding: 20px;'>" +
                    "  <div style='max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;'>" +
                    "    <div style='background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 35px 20px; text-align: center; color: white;'>" +
                    "      <h2 style='margin: 0;'>Chúc Mừng Bạn!</h2>" +
                    "      <p style='margin: 8px 0 0 0; opacity: 0.9;'>Sự kiện của bạn hiện đã được công bố.</p>" +
                    "    </div>" +
                    "    <div style='padding: 30px; color: #334155;'>" +
                    "      <p>Chào <strong>" + organizer.getFullName() + "</strong>,</p>" +
                    "      <p>Ban quản trị đã kiểm duyệt và phê duyệt sự kiện của bạn thành công:</p>" +
                    "      <div style='background: #f8fafc; border-left: 4px solid #10B981; padding: 15px 20px; margin: 20px 0;'>" +
                    "        <h3 style='margin: 0; color: #0f172a;'>" + event.getTitle() + "</h3>" +
                    "        <p style='margin: 5px 0 0 0; font-size: 14px;'>Địa điểm: " + event.getLocation() + "</p>" +
                    "      </div>" +
                    "      <p>Sự kiện hiện đang trong trạng thái mở bán vé và có thể truy cập công khai.</p>" +
                    "      <div style='text-align: center; margin: 30px 0;'>" +
                    "        <a href='" + eventLink + "' style='background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 600; display: inline-block;'>Xem Trang Sự Kiện</a>" +
                    "      </div>" +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(content, true);
            mailSender.send(message);
            
            // Create in-app notification for organizer
            notificationService.createNotification("🚀 Sự kiện \"" + event.getTitle() + "\" của bạn đã được phê duyệt thành công!", organizer);
            
            log.info("Successfully sent event approved email to organizer {}", organizer.getEmail());
        } catch (Exception e) {
            log.error("Failed to send event approved email for event id {}", event.getId(), e);
        }
    }

    @Async
    public void sendNewCommentEmail(Comment comment) {
        try {
            Event event = comment.getEvent();
            User organizer = event.getOrganizer();
            User commenter = comment.getUser();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "EventManager Team");
            helper.setTo(organizer.getEmail());
            helper.setSubject("💬 Đánh giá mới từ khán giả cho \"" + event.getTitle() + "\"");

            String stars = "⭐".repeat(Math.max(0, Math.min(5, comment.getRating() == null ? 5 : comment.getRating())));
            String feedbackLink = frontendUrl + "/organizer/feedback";

            String content = "<html>" +
                    "<body style='font-family: \"Helvetica Neue\", Arial, sans-serif; background-color: #f4f6f9; padding: 20px;'>" +
                    "  <div style='max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;'>" +
                    "    <div style='background: #F59E0B; padding: 25px; color: white;'>" +
                    "      <h3 style='margin: 0;'>Nhận Xét Mới Từ Người Dùng</h3>" +
                    "    </div>" +
                    "    <div style='padding: 30px; color: #334155;'>" +
                    "      <p>Chào <strong>" + organizer.getFullName() + "</strong>,</p>" +
                    "      <p>Sự kiện <strong>" + event.getTitle() + "</strong> của bạn vừa nhận được đánh giá từ người dùng:</p>" +
                    "      " +
                    "      <div style='background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;'>" +
                    "        <div style='font-weight: 600; margin-bottom: 5px;'>" + commenter.getFullName() + "</div>" +
                    "        <div style='color: #f59e0b; font-size: 18px; margin-bottom: 10px;'>" + stars + " (" + comment.getRating() + "/5)</div>" +
                    "        <div style='font-style: italic; color: #475569; font-size: 15px;'>\"" + comment.getContent() + "\"</div>" +
                    "      </div>" +
                    "      " +
                    "      <p>Bạn có thể đăng nhập vào Dashboard để phản hồi nhận xét này và tương tác trực tiếp với khán giả.</p>" +
                    "      <div style='text-align: center; margin-top: 25px;'>" +
                    "        <a href='" + feedbackLink + "' style='background-color: #4F46E5; color: white; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 600; display: inline-block;'>Phản Hồi Khán Giả</a>" +
                    "      </div>" +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(content, true);
            mailSender.send(message);
            
            // Create in-app notification for organizer
            notificationService.createNotification("💬 Nhận xét mới cho \"" + event.getTitle() + "\": " + commenter.getFullName() + " đã đánh giá " + comment.getRating() + "⭐", organizer);
            
            log.info("Successfully sent feedback notification email to organizer {}", organizer.getEmail());
        } catch (Exception e) {
            log.error("Failed to send feedback notification email for organizer", e);
        }
    }

    @Async
    public void sendEventPendingReview(Event event, java.util.List<User> admins) {
        try {
            if (admins == null || admins.isEmpty()) {
                log.warn("No administrators found to notify for event {}", event.getId());
                return;
            }

            User organizer = event.getOrganizer();
            String adminUrl = frontendUrl + "/admin/events"; // Or wherever the admin panel is located

            for (User admin : admins) {
                try {
                    MimeMessage message = mailSender.createMimeMessage();
                    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                    helper.setFrom(fromEmail, "EventManager System");
                    helper.setTo(admin.getEmail());
                    helper.setSubject("🔔 [KIỂM DUYỆT] Yêu cầu duyệt sự kiện mới: " + event.getTitle());

                    String content = "<html>" +
                            "<body style='font-family: \"Helvetica Neue\", Arial, sans-serif; background-color: #f4f6f9; padding: 20px;'>" +
                            "  <div style='max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;'>" +
                            "    <div style='background: #EF4444; padding: 25px; color: white;'>" +
                            "      <h3 style='margin: 0;'>Yêu Cầu Phê Duyệt Sự Kiện Mới</h3>" +
                            "    </div>" +
                            "    <div style='padding: 30px; color: #334155;'>" +
                            "      <p>Chào Quản Trị Viên <strong>" + admin.getFullName() + "</strong>,</p>" +
                            "      <p>Nhà tổ chức <strong>" + organizer.getFullName() + "</strong> vừa gửi yêu cầu kiểm duyệt cho một sự kiện mới:</p>" +
                            "      " +
                            "      <div style='background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;'>" +
                            "        <table style='width: 100%; font-size: 14px; color: #475569;'>" +
                            "          <tr><td style='font-weight:600; width: 120px;'>Tên Sự Kiện:</td><td style='color: #0f172a; font-weight:600;'>" + event.getTitle() + "</td></tr>" +
                            "          <tr><td style='font-weight:600;'>Nhà Tổ Chức:</td><td style='color: #0f172a;'>" + organizer.getFullName() + " (" + organizer.getEmail() + ")</td></tr>" +
                            "          <tr><td style='font-weight:600;'>Thời gian bắt đầu:</td><td style='color: #0f172a;'>" + event.getStartTime().toString() + "</td></tr>" +
                            "          <tr><td style='font-weight:600;'>Địa điểm:</td><td style='color: #0f172a;'>" + event.getLocation() + "</td></tr>" +
                            "        </table>" +
                            "      </div>" +
                            "      " +
                            "      <p>Vui lòng đăng nhập trang quản trị để tiến hành kiểm duyệt nội dung và phê duyệt sự kiện này.</p>" +
                            "      <div style='text-align: center; margin-top: 25px;'>" +
                            "        <a href='" + adminUrl + "' style='background-color: #EF4444; color: white; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 600; display: inline-block;'>Đi Đến Trang Kiểm Duyệt</a>" +
                            "      </div>" +
                            "    </div>" +
                            "  </div>" +
                            "</body>" +
                            "</html>";

                    helper.setText(content, true);
                    mailSender.send(message);
                    
                    // Create in-app notification for each admin
                    notificationService.createNotification("🔔 [KIỂM DUYỆT] Yêu cầu duyệt sự kiện \"" + event.getTitle() + "\" từ " + organizer.getFullName(), admin);
                } catch (Exception e) {
                    log.error("Failed to send pending event email to individual admin {}", admin.getEmail(), e);
                }
            }
            log.info("Finished processing email alerts to admin pool for event {}", event.getId());
        } catch (Exception e) {
            log.error("General failure in sending pending event admin emails", e);
        }
    }
}
