package com.taskflow.repository;

import com.taskflow.model.Column;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ColumnRepository extends JpaRepository<Column, Long> {
    List<Column> findByBoard_IdOrderByOrderAsc(Long boardId);
}