package com.pbl.pbl.entity.inheritance_example;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "organizer_accounts")
@DiscriminatorValue("ORGANIZER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrganizerAccount extends Account {

    @Column(name = "company_name", length = 150)
    private String companyName;

    @Column(name = "business_license", length = 50)
    private String businessLicense;

    @Override
    public String getDashboardUrl() {
        return "/organizer/dashboard";
    }
}
