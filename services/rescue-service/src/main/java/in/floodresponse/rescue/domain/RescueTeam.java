package in.floodresponse.rescue.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "rescue_teams", indexes = {
        @Index(name = "ux_team_code", columnList = "code", unique = true),
        @Index(name = "ix_team_district_status", columnList = "district,status")
})
public class RescueTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Call sign used on the radio, e.g. SDRF-KMR-02. */
    @Column(nullable = false, length = 24)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR) // plain text, so new values need no schema change
    @Column(nullable = false, length = 24)
    private TeamType type;

    @Column(nullable = false, length = 60)
    private String district;

    @Column(nullable = false, length = 80)
    private String leaderName;

    @Column(nullable = false, length = 20)
    private String phone;

    private int members;

    private int boats;

    private double baseLatitude;

    private double baseLongitude;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR) // plain text, so new values need no schema change
    @Column(nullable = false, length = 16)
    private TeamStatus status = TeamStatus.AVAILABLE;

    /** Stops two coordinators from dispatching the same team at the same moment. */
    @Version
    private long version;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public TeamType getType() { return type; }
    public void setType(TeamType type) { this.type = type; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getLeaderName() { return leaderName; }
    public void setLeaderName(String leaderName) { this.leaderName = leaderName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public int getMembers() { return members; }
    public void setMembers(int members) { this.members = members; }
    public int getBoats() { return boats; }
    public void setBoats(int boats) { this.boats = boats; }
    public double getBaseLatitude() { return baseLatitude; }
    public void setBaseLatitude(double baseLatitude) { this.baseLatitude = baseLatitude; }
    public double getBaseLongitude() { return baseLongitude; }
    public void setBaseLongitude(double baseLongitude) { this.baseLongitude = baseLongitude; }
    public TeamStatus getStatus() { return status; }
    public void setStatus(TeamStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
}
