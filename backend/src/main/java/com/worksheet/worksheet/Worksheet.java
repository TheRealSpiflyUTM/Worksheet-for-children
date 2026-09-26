package com.worksheet.worksheet;

import com.worksheet.auth.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "worksheet")
public class Worksheet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "row_version", nullable = false)
    private long rowVersion;

    protected Worksheet() {}

    public Worksheet(String name, User user) {
        this.name = name;
        this.user = user;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public User getUser() { return user; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getRowVersion() { return rowVersion; }

    public void setName(String name) {
        this.name = name;
        this.updatedAt = Instant.now();
    }
}
