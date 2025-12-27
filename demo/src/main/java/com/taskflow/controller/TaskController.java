package com.taskflow.controller;

import com.taskflow.model.Board;
import com.taskflow.model.Column;
import com.taskflow.model.Task;
import com.taskflow.model.User;
import com.taskflow.repository.BoardRepository;
import com.taskflow.repository.ColumnRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ColumnRepository columnRepository;

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTask(@PathVariable Long id, Authentication authentication) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!task.getBoard().getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(task);
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Map<String, Object> request, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long boardId = Long.valueOf(request.get("boardId").toString());
        Long columnId = Long.valueOf(request.get("columnId").toString());

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found"));

        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        Column column = columnRepository.findById(columnId)
                .orElseThrow(() -> new RuntimeException("Column not found"));

        Task task = new Task();
        task.setTitle(request.get("title").toString());
        task.setDescription(request.get("description") != null ? request.get("description").toString() : "");
        task.setColumn(column);
        task.setBoard(board);

        if (request.containsKey("priority")) {
            task.setPriority(Task.Priority.valueOf(request.get("priority").toString()));
        }

        if (request.containsKey("dueDate") && request.get("dueDate") != null && !request.get("dueDate").toString().isEmpty()) {
            task.setDueDate(LocalDate.parse(request.get("dueDate").toString()));
        }

        if (request.containsKey("tags")) {
            @SuppressWarnings("unchecked")
            List<String> tags = (List<String>) request.get("tags");
            task.setTags(tags);
        }

        return ResponseEntity.ok(taskRepository.save(task));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Map<String, Object> request,
                                           Authentication authentication) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!task.getBoard().getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        if (request.containsKey("title")) {
            task.setTitle(request.get("title").toString());
        }

        if (request.containsKey("description")) {
            task.setDescription(request.get("description").toString());
        }

        if (request.containsKey("columnId")) {
            Long columnId = Long.valueOf(request.get("columnId").toString());
            Column column = columnRepository.findById(columnId)
                    .orElseThrow(() -> new RuntimeException("Column not found"));
            task.setColumn(column);
        }

        if (request.containsKey("priority")) {
            task.setPriority(Task.Priority.valueOf(request.get("priority").toString()));
        }

        if (request.containsKey("dueDate")) {
            if (request.get("dueDate") != null && !request.get("dueDate").toString().isEmpty()) {
                task.setDueDate(LocalDate.parse(request.get("dueDate").toString()));
            } else {
                task.setDueDate(null);
            }
        }

        if (request.containsKey("tags")) {
            @SuppressWarnings("unchecked")
            List<String> tags = (List<String>) request.get("tags");
            task.setTags(tags);
        }

        return ResponseEntity.ok(taskRepository.save(task));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, Authentication authentication) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!task.getBoard().getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        taskRepository.delete(task);
        return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
    }
}