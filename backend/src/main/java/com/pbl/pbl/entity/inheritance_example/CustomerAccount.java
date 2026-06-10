package com.pbl.pbl.entity.inheritance_example;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_accounts")
@DiscriminatorValue("CUSTOMER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerAccount extends Account {

    @Column(name = "loyalty_points", nullable = false)
    private Long loyaltyPoints = 0L;

    public void addLoyaltyPoints(Long points) {
        this.loyaltyPoints += points;
    }

    @Override
    public String getDashboardUrl() {
        return "/customer/profile";
    }
}
