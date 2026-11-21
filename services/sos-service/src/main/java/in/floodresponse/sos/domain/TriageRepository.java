package in.floodresponse.sos.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TriageRepository extends JpaRepository<Triage, Long> {

    Optional<Triage> findBySosId(Long sosId);

    boolean existsBySosId(Long sosId);

    @Query("select t from Triage t join fetch t.sos s where s.id in :ids")
    List<Triage> findBySosIds(Collection<Long> ids);

    /** Requests that should have been triaged by now but weren't (AI service was down, etc.). */
    @Query("""
            select s.id from SosRequest s
            where s.receivedAt < :before and s.receivedAt > :since
              and not exists (select 1 from Triage t where t.sos = s)
            order by s.receivedAt
            """)
    List<Long> findUntriaged(Instant since, Instant before, org.springframework.data.domain.Limit limit);
}
