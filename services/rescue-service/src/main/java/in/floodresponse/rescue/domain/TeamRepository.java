package in.floodresponse.rescue.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TeamRepository extends JpaRepository<RescueTeam, Long> {

    boolean existsByCode(String code);

    List<RescueTeam> findByStatus(TeamStatus status);

    @Query("""
            select t from RescueTeam t
            where (:status is null or t.status = :status)
              and (:district is null or t.district = :district)
            order by t.district, t.code
            """)
    List<RescueTeam> search(TeamStatus status, String district);
}
