package com.pbl.pbl.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pbl.pbl.entity.Province;
import com.pbl.pbl.entity.Ward;
import com.pbl.pbl.repository.ProvinceRepository;
import com.pbl.pbl.repository.WardRepository;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    @Autowired
    private ProvinceRepository provinceRepository;

    @Autowired
    private WardRepository wardRepository;

    @GetMapping("/provinces")
    public List<Province> getAllProvinces() {
        return provinceRepository.findAll();
    }

    @GetMapping("/provinces/{provinceId}/wards")
    public List<Ward> getWardsByProvince(@PathVariable Long provinceId) {
        return wardRepository.findByProvinceId(provinceId);
    }
}
