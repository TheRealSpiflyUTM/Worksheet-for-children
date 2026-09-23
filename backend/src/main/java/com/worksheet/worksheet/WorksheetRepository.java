package com.worksheet.worksheets;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorksheetRepository extends JpaRepository<Worksheet, Long> {
}