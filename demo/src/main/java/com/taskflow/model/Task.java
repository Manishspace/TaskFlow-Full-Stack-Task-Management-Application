package com.taskflow.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @jakarta.persistence.Column(nullable = false)
    private String title;

    @jakarta.persistence.Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    @JsonIgnore
    private com.taskflow.model.Column column;

    @Transient
    private Long columnId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    @JsonIgnore
    private Board board;

    @Transient
    private Long boardId;

    @Enumerated(EnumType.STRING)
    @jakarta.persistence.Column(nullable = false)
    private Priority priority = Priority.MEDIUM;

    @ElementCollection
    @CollectionTable(name = "task_tags", joinColumns = @JoinColumn(name = "task_id"))
    @jakarta.persistence.Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @jakarta.persistence.Column(name = "due_date")
    private LocalDate dueDate;

    @jakarta.persistence.Column(name = "task_order")
    private Integer order;

    @CreatedDate
    @jakarta.persistence.Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @PostLoad
    private void onLoad() {
        if (this.column != null) {
            this.columnId = this.column.getId();
        }
        if (this.board != null) {
            this.boardId = this.board.getId();
        }
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }
}