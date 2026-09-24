package com.worksheet.classroom;

import com.worksheet.auth.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "classroom_member", uniqueConstraints = @UniqueConstraint(columnNames = {"classroom_id", "user_id"}))
public class ClassroomMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    protected ClassroomMember() {}

    public ClassroomMember(Classroom classroom, User user) {
        this.classroom = classroom;
        this.user = user;
        this.joinedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Classroom getClassroom() { return classroom; }
    public User getUser() { return user; }
    public Instant getJoinedAt() { return joinedAt; }
    public Instant getLeftAt() { return leftAt; }

    public void rejoin() {
        this.joinedAt = Instant.now();
        this.leftAt = null;
    }

    public void leave() { this.leftAt = Instant.now(); }
}
