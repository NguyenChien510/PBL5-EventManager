package com.pbl.pbl;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class pblApplication {

    public static void main(String[] args) {
        SpringApplication.run(pblApplication.class, args);
    }

}
