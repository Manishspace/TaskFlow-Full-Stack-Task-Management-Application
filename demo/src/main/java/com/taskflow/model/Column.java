package com.taskflow.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "columns")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Column {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @jakarta.persistence.Column(nullable = false)
    private String name;

    @jakarta.persistence.Column(name = "column_order")
    private Integer order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    @JsonIgnore
    private Board board;

    @OneToMany(mappedBy = "column", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Task> tasks = new ArrayList<>();

    @CreatedDate
    @jakarta.persistence.Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public void addTask(Task task) {
        tasks.add(task);
        task.setColumn(this);
    }
}