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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boards")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class BoardController {

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private ColumnRepository columnRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Board>> getAllBoards(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(boardRepository.findByOwner_Id(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoard(@PathVariable Long id, Authentication authentication) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Board not found"));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(board);
    }

    @PostMapping
    public ResponseEntity<Board> createBoard(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Board board = new Board();
            board.setName(request.get("name"));
            board.setDescription(request.get("description"));
            board.setOwner(user);

            Board savedBoard = boardRepository.save(board);

            String[] defaultColumns = {"To Do", "In Progress", "Done"};
            for (int i = 0; i < defaultColumns.length; i++) {
                com.taskflow.model.Column column = new com.taskflow.model.Column();
                column.setName(defaultColumns[i]);
                column.setOrder(i);
                column.setBoard(savedBoard);
                columnRepository.save(column);
            }

            return ResponseEntity.ok(savedBoard);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Board> updateBoard(@PathVariable Long id, @RequestBody Map<String, String> request,
                                             Authentication authentication) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Board not found"));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        board.setName(request.get("name"));
        board.setDescription(request.get("description"));

        return ResponseEntity.ok(boardRepository.save(board));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBoard(@PathVariable Long id, Authentication authentication) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Board not found"));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        boardRepository.delete(board);
        return ResponseEntity.ok(Map.of("message", "Board deleted successfully"));
    }

    @GetMapping("/{id}/columns")
    public ResponseEntity<List<Column>> getColumns(@PathVariable Long id, Authentication authentication) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Board not found"));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(columnRepository.findByBoard_IdOrderByOrderAsc(id));
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<Task>> getTasks(@PathVariable Long id, Authentication authentication) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Board not found"));

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!board.getOwner().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(taskRepository.findByBoard_IdOrderByOrderAsc(id));
    }
}