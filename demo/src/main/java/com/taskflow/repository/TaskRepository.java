package com.taskflow.repository;

import com.taskflow.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByBoard_IdOrderByOrderAsc(Long boardId);
    List<Task> findByColumn_IdOrderByOrderAsc(Long columnId);
}